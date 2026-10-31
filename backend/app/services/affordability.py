"""Can I afford it? A pure function of Inputs, so every number can be traced and what-ifs reuse it.

For each case (worst / typical / best), cash left for the purchase is:
    cash now + income - committed - variable spend - buffer      (summed over every month up to the target month)
"""
from dataclasses import replace
from datetime import date, timedelta

from app.config import (BUFFER_MONTHS, CASES, CONFIDENCE_BORDERLINE_SHARE, CONFIDENCE_INCOME_SPREAD,
                        CONFIDENCE_MAX_HORIZON, CONFIDENCE_MIN_MONTHS_HIGH)
from app.services.stats import add_months, month_end, month_of, months_between, percentile

VERDICTS = {
    "yes": "Yes. You can afford it even in the worst case.",
    "risky": "Probably, but not if your income comes in at the low end.",
    "stretch": "Only if your income comes in at the high end.",
    "no": "No. It does not fit even in the best case.",
}


def horizon(as_of, target_month):
    """Months from the one after the latest statement up to and including the target month."""
    first = add_months(month_of(as_of), 1)
    if target_month < first:
        raise ValueError(f"Target month must be {first} or later (your statements end {as_of.isoformat()}).")
    return months_between(first, target_month)


def occurrences_in_month(item, month):
    """How many times a recurring payment falls in `month`."""
    if item.get("start") and month < item["start"]:
        return 0
    last, cadence = date.fromisoformat(item["last_seen"]), item["cadence_days"]
    if cadence == 30:
        return 1  # monthly: once a month, on its usual day
    if cadence == 365:
        return int(last.month == int(month[5:]))
    count, d = 0, last + timedelta(days=cadence)
    while d <= month_end(month):  # weekly: step forward and count the dates inside the month
        count += d >= date(int(month[:4]), int(month[5:]), 1)
        d += timedelta(days=cadence)
    return count


def committed(inp, months):
    """Recurring payments due in these months: (total paise, list of items)."""
    items = []
    for r in inp.recurring:
        n = sum(occurrences_in_month(r, m) for m in months)
        if n:
            items.append({"merchant": r["merchant"], "label": r["label"], "count": n, "paise": n * -r["typical_paise"]})
    return sum(i["paise"] for i in items), items


def run_case(inp, name, n_months, committed_total, buffer, price, extra_income=0):
    """Every step of one case, so the UI (and the team) can show the working."""
    income_pct, variable_key = CASES[name]
    income = round(percentile(inp.monthly_income, income_pct)) * n_months + extra_income
    variable = sum(v[variable_key] for v in inp.variable.values()) * n_months
    headroom = inp.start_cash + income - committed_total - variable - buffer
    return {"case": name, "startingCashPaise": inp.start_cash, "incomePaise": income, "committedPaise": committed_total,
            "variablePaise": variable, "bufferPaise": buffer, "headroomPaise": headroom, "pricePaise": price,
            "leftAfterPurchasePaise": headroom - price, "affordable": headroom >= price}


def verdict_of(cases):
    ok = {name: c["affordable"] for name, c in cases.items()}
    code = "yes" if ok["worst"] else "risky" if ok["typical"] else "stretch" if ok["best"] else "no"
    return {"code": code, "text": VERDICTS[code]}


def confidence_of(inp, cases, price, n_months):
    """High / Medium / Low, each lost level with its reason."""
    reasons = []
    if len(inp.history_months) < CONFIDENCE_MIN_MONTHS_HIGH:
        reasons.append(f"only {len(inp.history_months)} months of history")
    typical = percentile(inp.monthly_income, 50)
    if typical and (percentile(inp.monthly_income, CASES["best"][0]) - percentile(inp.monthly_income, CASES["worst"][0])) \
            / typical > CONFIDENCE_INCOME_SPREAD:
        reasons.append("income varies a lot from month to month")
    if abs(cases["typical"]["leftAfterPurchasePaise"]) <= CONFIDENCE_BORDERLINE_SHARE * price:
        reasons.append("the typical case is close to the line")
    if n_months > CONFIDENCE_MAX_HORIZON:
        reasons.append(f"forecasting {n_months} months ahead")
    label = ["High", "Medium", "Low"][min(len(reasons), 2)]
    return {"label": label, "reason": "; ".join(reasons).capitalize() + "." if reasons else
            f"Steady income, {len(inp.history_months)} months of history and a clear margin."}


def evaluate(inp, price, target_month):
    """The full answer. Raises ValueError if the target month is not after the statements."""
    months = horizon(inp.as_of, target_month)
    committed_total, items = committed(inp, months)
    buffer = round(BUFFER_MONTHS * committed_total / len(months))  # one month of committed costs
    cases = {name: run_case(inp, name, len(months), committed_total, buffer, price) for name in CASES}
    bonus = None
    if inp.one_offs:  # what if the one-off income happened again once
        extra = max(inp.one_offs, key=lambda o: o["date"])
        with_it = {n: run_case(inp, n, len(months), committed_total, buffer, price, extra["paise"]) for n in CASES}
        bonus = {"oneOff": extra, "verdict": verdict_of(with_it),
                 "cases": {n: {"headroomPaise": c["headroomPaise"], "leftAfterPurchasePaise": c["leftAfterPurchasePaise"],
                               "affordable": c["affordable"]} for n, c in with_it.items()}}
    return {"pricePaise": price, "targetMonth": target_month, "months": months, "asOf": inp.as_of.isoformat(),
            "startingCashPaise": inp.start_cash, "committed": items, "variableByCategory": inp.variable,
            "cases": cases, "verdict": verdict_of(cases), "confidence": confidence_of(inp, cases, price, len(months)),
            "bonusScenario": bonus}


def apply_changes(inp, cancel=(), add_emi=None):
    """The what-if inputs: drop recurring payments by merchant and/or add a new monthly EMI.

    Raises KeyError with the unknown merchant names.
    """
    known = {r["merchant"].upper(): r for r in inp.recurring}
    unknown = [c for c in cancel if c.upper() not in known]
    if unknown:
        raise KeyError(unknown)
    kept = [r for r in inp.recurring if r["merchant"].upper() not in {c.upper() for c in cancel}]
    if add_emi:
        kept.append({"merchant": add_emi["name"], "label": "emi", "typical_paise": -add_emi["amountPaise"],
                     "cadence_days": 30, "occurrences": 0, "last_seen": inp.as_of.isoformat(),
                     "next_expected": None, "start": add_emi.get("startMonth")})
    return replace(inp, recurring=tuple(kept))


def what_if(inp, price, target_month, cancel=(), add_emi=None):
    """Original vs modified answer, and the change per case."""
    original = evaluate(inp, price, target_month)
    modified = evaluate(apply_changes(inp, cancel, add_emi), price, target_month)
    change = {n: modified["cases"][n]["leftAfterPurchasePaise"] - original["cases"][n]["leftAfterPurchasePaise"]
              for n in CASES}
    return {"original": original, "modified": modified, "changePaise": change,
            "verdictChanged": original["verdict"]["code"] != modified["verdict"]["code"]}


def monthly_surplus_forecast(inp, month):
    """Worst / typical / best surplus (income - committed - variable) for one month.

    Uses the same cases as the affordability answer, so what we log is what we would have told the user.
    """
    committed_total, _ = committed(inp, [month])
    out = {}
    for name, (income_pct, variable_key) in CASES.items():
        variable = sum(v[variable_key] for v in inp.variable.values())
        out[name] = round(percentile(inp.monthly_income, income_pct)) - committed_total - variable
    return out
