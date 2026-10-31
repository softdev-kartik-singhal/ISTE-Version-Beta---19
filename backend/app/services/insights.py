"""Monthly surplus, trends, money left this month, weekly safe-to-spend, upcoming payments.

Money out/in here means normal rows only: transfers between own accounts and confirmed
duplicates never count. 'Now' is the date of the latest statement row, as in the forecast.
"""
import calendar
from collections import defaultdict
from datetime import date, timedelta
from statistics import median

from app.config import (BUFFER_MONTHS, CASES, FIXED_CATEGORIES, MIN_HISTORY_MONTHS, TREND_BASELINE_MONTHS, TREND_FLAT_PCT, TRENDS_MONTHS, UPCOMING_DAYS,
                        INSIGHT_MIN_MONTHS)
from app.services.money import inr
from app.services.stats import add_months, month_end, month_of, percentile


def rs(paise):
    """Rupee text for reason/insight sentences (₹ with Indian grouping, like the frontend)."""
    return inr(paise)


def load_ledger(conn, user_id):
    """Every normal transaction of the user, with its account, category and month.
    anomaly=True marks a payment flagged as unusually large: a one-off kept out of "usual" baselines."""
    from app.services.flags import large_flags, load_rows  # local import: flags is a sibling service
    anomalies = {f["transactionId"] for f in large_flags(load_rows(conn, user_id))}
    rows = conn.execute(
        "SELECT t.id, t.txn_date, t.amount_paise, t.merchant, c.name AS category, a.id AS account_id, a.bank, a.last4"
        " FROM transactions t JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
        " WHERE a.user_id = ? AND t.kind = 'normal' ORDER BY t.txn_date, t.id", (user_id,)).fetchall()
    return [{**dict(r), "month": month_of(r["txn_date"]), "category": r["category"] or "Other", "anomaly": r["id"] in anomalies}
            for r in rows]


def category_by_month(ledger, months, skip_anomalies=False):
    """category -> {month: money-out paise} for the given months (zeros filled in).
    skip_anomalies leaves out payments flagged as unusually large (for "usual" baselines)."""
    out = defaultdict(lambda: dict.fromkeys(months, 0))
    for r in ledger:
        if r["amount_paise"] < 0 and r["month"] in months and not (skip_anomalies and r.get("anomaly")):
            out[r["category"]][r["month"]] += -r["amount_paise"]
    return out


def monthly_series(ledger, inp):
    """Per history month: inflow, outflow, surplus, plus the one-off income inside the inflow."""
    out = []
    for month in inp.history_months:
        rows = [r for r in ledger if r["month"] == month]
        inflow = sum(r["amount_paise"] for r in rows if r["amount_paise"] > 0)
        outflow = sum(-r["amount_paise"] for r in rows if r["amount_paise"] < 0)
        one_off = sum(o["paise"] for o in inp.one_offs if month_of(o["date"]) == month)
        out.append({"month": month, "inflowPaise": inflow, "outflowPaise": outflow, "surplusPaise": inflow - outflow,
                    "oneOffPaise": one_off})
    return out


def planning_surplus(ledger, inp):
    """Surplus per history month with one-off income removed: what the user can rely on saving."""
    series = monthly_series(ledger, inp)
    return [m["surplusPaise"] - m["oneOffPaise"] for m in series]


def biggest(ledger, month, income):
    """Largest single credit (income=True) or debit in a month, for the best/toughest reasons."""
    rows = [r for r in ledger if r["month"] == month and (r["amount_paise"] > 0) == income]
    return max(rows, key=lambda r: abs(r["amount_paise"]), default=None)


def category_trends(ledger, months):
    """Latest month vs the median of the earlier baseline months, per category, with a plain sentence.
    The baseline leaves out flagged one-off large payments; the latest month and the sparkline show what really happened."""
    table = category_by_month(ledger, months)
    usual = category_by_month(ledger, months, skip_anomalies=True)
    this_month = months[-1]
    by_merchant = defaultdict(lambda: defaultdict(int))  # category -> merchant -> money out, for the "examples" column
    for r in ledger:
        if r["amount_paise"] < 0 and r["month"] in months:
            by_merchant[r["category"]][r["merchant"]] += -r["amount_paise"]
    out = []
    for name, by_month in table.items():
        series = [by_month[m] for m in months]
        baseline = median([usual[name][m] for m in months[-1 - TREND_BASELINE_MONTHS:-1]])
        now = by_month[this_month]
        change = None if baseline == 0 else round((now / baseline - 1) * 100, 1)
        direction = "new" if change is None else "flat" if abs(change) <= TREND_FLAT_PCT else "up" if change > 0 else "down"
        out.append({"name": name, "thisMonthPaise": now, "medianPaise": int(baseline), "changePct": change,
                    "direction": direction, "merchants": sorted(by_merchant[name], key=by_merchant[name].get, reverse=True)[:3], "sparklinePaise": series, "insight": trend_sentence(name, now, baseline, change)})
    return sorted(out, key=lambda c: -c["thisMonthPaise"])


def trend_sentence(name, now, baseline, change):
    if now == 0 and baseline == 0:
        return f"No {name} spending."
    if change is None:
        return f"{name}: {rs(now)} this month, with nothing in the previous {TREND_BASELINE_MONTHS} months."
    if abs(change) <= TREND_FLAT_PCT:
        return f"{name} is steady at {rs(now)}, in line with your usual {rs(baseline)}."
    side = "above" if change > 0 else "below"
    return f"{name} is {abs(change):.0f}% {side} your usual: {rs(now)} against a {rs(baseline)} median."


def trends(ledger, inp):
    """GET /api/trends payload."""
    series = monthly_series(ledger, inp)[-TRENDS_MONTHS:]
    if len(inp.history_months) < INSIGHT_MIN_MONTHS:
        return {"insufficientHistory": True, "monthsAvailable": len(inp.history_months), "months": series,
                "categories": [], "findings": [], "summary": None}
    months = [m["month"] for m in series]
    best, worst = max(series, key=lambda m: m["surplusPaise"]), min(series, key=lambda m: m["surplusPaise"])
    top_in, top_out = biggest(ledger, best["month"], True), biggest(ledger, worst["month"], False)
    cats = category_trends(ledger, inp.history_months)
    positive = sum(m["surplusPaise"] > 0 for m in series)
    return {"insufficientHistory": False, "monthsAvailable": len(inp.history_months), "months": series,
            "summary": {"averageSurplusPaise": int(median(m["surplusPaise"] for m in series)),
                        "best": {"month": best["month"], "surplusPaise": best["surplusPaise"],
                                 "reason": f"Biggest credit was {top_in['merchant']} ({rs(top_in['amount_paise'])})" if top_in else ""},
                        "toughest": {"month": worst["month"], "surplusPaise": worst["surplusPaise"],
                                     "reason": f"Biggest payment was {top_out['merchant']} ({rs(-top_out['amount_paise'])})" if top_out else ""}},
            "categoryMonth": months[-1], "categories": cats, "findings": findings(series, cats, inp, positive)}


def findings(series, cats, inp, positive):
    out = [f"Surplus was positive in {positive} of the last {len(series)} months."]
    rising = [c for c in cats if c["direction"] == "up"]  # increases are the ones worth a look
    if rising:
        out.append(max(rising, key=lambda c: c["thisMonthPaise"] - c["medianPaise"])["insight"])
    for o in inp.one_offs:
        out.append(f"{rs(o['paise'])} from {o['merchant']} on {o['date']} is a one-off and is left out of planning figures.")
    return out


# ---------- this month: money left, safe to spend, upcoming ----------

def due_dates(item, after, until):
    """Dates a recurring payment falls due, with after < date <= until."""
    last, cadence = date.fromisoformat(item["last_seen"]), item["cadence_days"]
    out, k = [], 1
    while True:
        if cadence == 7:
            d = last + timedelta(days=7 * k)
        elif cadence == 30:
            m = add_months(month_of(last), k)
            d = date(int(m[:4]), int(m[5:]), min(last.day, calendar.monthrange(int(m[:4]), int(m[5:]))[1]))
        else:
            d = date(last.year + k, last.month, min(last.day, calendar.monthrange(last.year + k, last.month)[1]))
        if d > until:
            return out
        if d > after:
            out.append(d)
        k += 1


def upcoming(inp):
    """Money-out recurring payments due in the next UPCOMING_DAYS after the latest statement date."""
    until = inp.as_of + timedelta(days=UPCOMING_DAYS)
    items = [{"merchant": r["merchant"], "label": r["label"], "amountPaise": -r["typical_paise"],
              "dueDate": d.isoformat(), "daysAway": (d - inp.as_of).days}
             for r in inp.recurring for d in due_dates(r, inp.as_of, until)]
    return sorted(items, key=lambda i: i["dueDate"])


def buffer_paise(inp):
    """Safety buffer: BUFFER_MONTHS of committed (recurring money-out) payments."""
    return round(BUFFER_MONTHS * sum(-r["typical_paise"] for r in inp.recurring))


def next_salary(ledger, as_of):
    """Expected date of the next salary: the last 'Salary' credit plus one month (same day). None if no salary."""
    paid = [date.fromisoformat(r["txn_date"]) for r in ledger if r["category"] == "Salary" and r["amount_paise"] > 0]
    if not paid:
        return None
    last = max(paid)
    m = add_months(month_of(last), 1)
    d = date(int(m[:4]), int(m[5:]), min(last.day, calendar.monthrange(int(m[:4]), int(m[5:]))[1]))
    return d if d > as_of else None


def this_month(ledger, inp):
    """Money left this month and the weekly safe-to-spend figure.

    money left = expected income - spent so far - committed payments still due this month
    expected income = what has arrived (one-offs excluded) or typical monthly income, whichever is larger,
    so the figure is not negative just because salary has not landed yet.

    safe to spend per week = money left until the next salary (or month end if no salary is known), after
    the committed payments due before then and keeping the safety buffer in cash, divided by the weeks to it.
    """
    month, end = month_of(inp.as_of), month_end(month_of(inp.as_of))
    rows = [r for r in ledger if r["month"] == month]
    skip = {(o["date"], o["merchant"], o["paise"]) for o in inp.one_offs}
    received = sum(r["amount_paise"] for r in rows if r["amount_paise"] > 0
                   and (r["txn_date"], r["merchant"], r["amount_paise"]) not in skip)
    spent = sum(-r["amount_paise"] for r in rows if r["amount_paise"] < 0)
    typical = round(median(inp.monthly_income)) if inp.monthly_income else 0
    expected = max(received, typical)
    still_due = sum(-r["typical_paise"] for r in inp.recurring for _ in due_dates(r, inp.as_of, end))
    left = expected - spent - still_due
    days_left = (end - inp.as_of).days

    salary = next_salary(ledger, inp.as_of)
    until = salary or end
    due_after_month = sum(-r["typical_paise"] for r in inp.recurring for _ in due_dates(r, end, until)) if until > end else 0
    spendable = left - due_after_month                                      # payments before the next salary come first
    keep = inp.start_cash - still_due - due_after_month - buffer_paise(inp)  # cash that may go before the buffer is touched
    spendable = min(spendable, keep)
    weeks = max((until - inp.as_of).days / 7, 1)                            # never divide a sliver into more than one week
    safe = max(0, round(spendable / weeks))
    return {"month": month, "incomeReceivedPaise": received, "expectedIncomePaise": expected, "spentSoFarPaise": spent,
            "committedStillDuePaise": still_due, "moneyLeftPaise": left, "daysLeft": days_left,
            "weeklySafeToSpendPaise": safe, "safeUntil": until.isoformat(), "nextSalary": salary.isoformat() if salary else None,
            "committedBeforeSalaryPaise": due_after_month,
            "note": "Money left is below zero: spending and upcoming payments exceed this month's income."
            if left < 0 else None}


def projection(inp, weeks=8):
    """Cash week by week for the next `weeks`, in the three cases (worst / typical / best).

    Each week adds an even share of that case's monthly income and takes off an even share of its
    variable spend, then takes off the recurring payments that really fall due that week.
    """
    per_week = 12 / 52  # a month's flow spread over its weeks
    out, cash = [], {name: inp.start_cash for name in CASES}
    for i in range(weeks):
        start, end = inp.as_of + timedelta(days=7 * i), inp.as_of + timedelta(days=7 * (i + 1))
        due = sum(-r["typical_paise"] for r in inp.recurring for _ in due_dates(r, start, end))
        for name, (pct, key) in CASES.items():
            income = percentile(inp.monthly_income, pct)
            variable = sum(v[key] for v in inp.variable.values())
            cash[name] += round((income - variable) * per_week) - due
        out.append({"weekStart": (start + timedelta(days=1)).isoformat(), **{n: int(c) for n, c in cash.items()}})
    return out


def spending_split(ledger, month):
    """This month's money out by category, and how much of it is fixed (rent, EMI)."""
    totals = defaultdict(int)
    for r in ledger:
        if r["month"] == month and r["amount_paise"] < 0:
            totals[r["category"]] += -r["amount_paise"]
    cats = [{"name": n, "amountPaise": v} for n, v in sorted(totals.items(), key=lambda kv: -kv[1])]
    fixed = sum(v for n, v in totals.items() if n in FIXED_CATEGORIES)
    return {"month": month, "totalPaise": sum(totals.values()), "fixedPaise": fixed,
            "flexiblePaise": sum(totals.values()) - fixed, "categories": cats}


def dashboard(ledger, inp):
    """GET /api/dashboard payload."""
    if not inp.history_months:
        return {"insufficientHistory": True, "monthsAvailable": 0, "asOf": inp.as_of.isoformat()}
    series = monthly_series(ledger, inp)
    # "Last month" = the calendar month before the statements' current month, never the current month itself.
    by_month = {m["month"]: m for m in series}
    prev = by_month.get(add_months(month_of(inp.as_of), -1))
    before = by_month.get(add_months(month_of(inp.as_of), -2))
    return {"insufficientHistory": False, "monthsAvailable": len(inp.history_months), "asOf": inp.as_of.isoformat(),
            "previousMonth": prev,
            "previousVsBeforePaise": prev["surplusPaise"] - before["surplusPaise"] if prev and before else None,
            "latestMonth": series[-1], "monthlySurplus": series[-1]["surplusPaise"],
            "planningSurplusPaise": int(median(planning_surplus(ledger, inp))), "cashPaise": inp.start_cash,
            "thisMonth": this_month(ledger, inp), "upcoming": upcoming(inp),
            "surplusVsPrevPaise": series[-1]["surplusPaise"] - series[-2]["surplusPaise"] if len(series) > 1 else None,
            "analyzedTransactions": sum(r["month"] == series[-1]["month"] for r in ledger),
            "spending": spending_split(ledger, series[-1]["month"]),
            "bufferPaise": buffer_paise(inp),
            "projection": projection(inp) if len(inp.history_months) >= MIN_HISTORY_MONTHS else None}
