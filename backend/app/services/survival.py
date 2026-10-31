"""If income stopped: how many months the cash on hand would last, and what could be stopped to make it last longer.

The method, in plain arithmetic on the user's own statements:
  monthly spending = the usual month (median of the last 3 months) of every spending category, with one-off large
                     payments flagged as anomalies left out
  months of survival = cash on hand / monthly spending
Essentials (rent, EMI, bills, groceries, travel, fuel) are assumed to carry on. Everything else can be stopped,
and each one is listed with the months it would add if it alone were stopped. Subscriptions are listed one by one.
Not included: severance, unemployment benefit, or any new income.
"""
from statistics import median

from app.config import ESSENTIAL_CATEGORIES, VARIABLE_MONTHS
from app.services.insights import category_by_month


def usual_monthly_spend(ledger, history_months):
    """category -> usual monthly spend in paise (median of the last few months, zeros counted, one-offs left out)."""
    last = list(history_months)[-VARIABLE_MONTHS:]
    table = category_by_month(ledger, last, skip_anomalies=True)
    usual = {name: int(median(by_month.values())) for name, by_month in table.items()}
    return {name: paise for name, paise in usual.items() if paise > 0}


def months_lasting(cash, monthly_spend):
    """Months the cash lasts at this monthly spending; None when there is nothing being spent."""
    if monthly_spend <= 0:
        return None
    return max(0, cash) / monthly_spend


def survival(ledger, inp):
    """GET /api/survival payload."""
    if not inp.history_months:
        return {"insufficientHistory": True}
    usual = usual_monthly_spend(ledger, inp.history_months)
    cash = inp.start_cash
    burn = sum(usual.values())

    essentials = sorted(({"name": n, "monthlyPaise": v} for n, v in usual.items() if n in ESSENTIAL_CATEGORIES),
                        key=lambda e: -e["monthlyPaise"])

    # What could be stopped: every non-essential category, with each subscription listed on its own.
    cuts = []
    subs = [{"id": f"sub:{r['merchant']}", "kind": "subscription", "name": r["merchant"], "monthlyPaise": -r["typical_paise"]}
            for r in inp.recurring if r["label"] == "subscription" and r["typical_paise"] < 0]
    listed_subs = sum(s["monthlyPaise"] for s in subs)
    cuts += subs
    for name, paise in usual.items():
        if name in ESSENTIAL_CATEGORIES:
            continue
        if name == "Subscriptions":  # the category already holds the subscriptions above; keep any remainder
            paise -= min(paise, listed_subs)
            name = "Other subscriptions"
        if paise > 0:
            cuts.append({"id": f"cat:{name}", "kind": "category", "name": name, "monthlyPaise": paise})

    now = months_lasting(cash, burn)
    for c in cuts:
        after = months_lasting(cash, burn - c["monthlyPaise"])
        c["monthsIfStopped"] = after
        c["addsMonths"] = None if after is None or now is None else after - now
    cuts.sort(key=lambda c: -c["monthlyPaise"])

    cut_total = sum(c["monthlyPaise"] for c in cuts)
    lean = burn - cut_total  # spending if everything stoppable were stopped
    return {"insufficientHistory": False, "asOf": inp.as_of.isoformat(), "cashPaise": cash,
            "monthlySpendPaise": burn, "monthsNow": now,
            "leanMonthlySpendPaise": lean, "monthsLean": months_lasting(cash, lean),
            "essentials": essentials, "cuts": cuts}
