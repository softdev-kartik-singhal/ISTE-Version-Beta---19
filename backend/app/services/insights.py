"""Monthly surplus, trends, money left this month, weekly safe-to-spend, upcoming payments.

Money out/in here means normal rows only: transfers between own accounts and confirmed
duplicates never count. 'Now' is the date of the latest statement row, as in the forecast.
"""
import calendar
from collections import defaultdict
from datetime import date, timedelta
from statistics import median

from app.config import (SAFE_TO_SPEND_MARGIN, TREND_BASELINE_MONTHS, TREND_FLAT_PCT, TRENDS_MONTHS, UPCOMING_DAYS,
                        INSIGHT_MIN_MONTHS)
from app.services.stats import add_months, month_end, month_of


def rs(paise):
    """Plain rupee text for insight sentences (the frontend formats money elsewhere)."""
    return f"Rs {paise / 100:,.0f}"


def load_ledger(conn, user_id):
    """Every normal transaction of the user, with its account, category and month."""
    rows = conn.execute(
        "SELECT t.id, t.txn_date, t.amount_paise, t.merchant, c.name AS category, a.id AS account_id, a.bank, a.last4"
        " FROM transactions t JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
        " WHERE a.user_id = ? AND t.kind = 'normal' ORDER BY t.txn_date, t.id", (user_id,)).fetchall()
    return [{**dict(r), "month": month_of(r["txn_date"]), "category": r["category"] or "Other"} for r in rows]


def category_by_month(ledger, months):
    """category -> {month: money-out paise} for the given months (zeros filled in)."""
    out = defaultdict(lambda: dict.fromkeys(months, 0))
    for r in ledger:
        if r["amount_paise"] < 0 and r["month"] in months:
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
    """Latest month vs the median of the earlier baseline months, per category, with a plain sentence."""
    table = category_by_month(ledger, months)
    this_month = months[-1]
    out = []
    for name, by_month in table.items():
        series = [by_month[m] for m in months]
        baseline = median(series[-1 - TREND_BASELINE_MONTHS:-1])
        now = by_month[this_month]
        change = None if baseline == 0 else round((now / baseline - 1) * 100, 1)
        direction = "new" if change is None else "flat" if abs(change) <= TREND_FLAT_PCT else "up" if change > 0 else "down"
        out.append({"name": name, "thisMonthPaise": now, "medianPaise": int(baseline), "changePct": change,
                    "direction": direction, "sparklinePaise": series, "insight": trend_sentence(name, now, baseline, change)})
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


def this_month(ledger, inp):
    """Money left this month and the weekly safe-to-spend figure.

    money left = expected income - spent so far - committed payments still due this month
    expected income = what has arrived (one-offs excluded) or typical monthly income, whichever is larger,
    so the figure is not negative just because salary has not landed yet.
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
    weeks_left = max(days_left / 7, 1)  # never divide a month-end sliver into more than one week
    safe = max(0, round(left * (1 - SAFE_TO_SPEND_MARGIN) / weeks_left))
    return {"month": month, "incomeReceivedPaise": received, "expectedIncomePaise": expected, "spentSoFarPaise": spent,
            "committedStillDuePaise": still_due, "moneyLeftPaise": left, "daysLeft": days_left,
            "weeklySafeToSpendPaise": safe,
            "note": "Money left is below zero: spending and upcoming payments exceed this month's income."
            if left < 0 else None}


def dashboard(ledger, inp):
    """GET /api/dashboard payload."""
    if not inp.history_months:
        return {"insufficientHistory": True, "monthsAvailable": 0, "asOf": inp.as_of.isoformat()}
    series = monthly_series(ledger, inp)
    return {"insufficientHistory": False, "monthsAvailable": len(inp.history_months), "asOf": inp.as_of.isoformat(),
            "latestMonth": series[-1], "monthlySurplus": series[-1]["surplusPaise"],
            "planningSurplusPaise": int(median(planning_surplus(ledger, inp))), "cashPaise": inp.start_cash,
            "thisMonth": this_month(ledger, inp), "upcoming": upcoming(inp)}
