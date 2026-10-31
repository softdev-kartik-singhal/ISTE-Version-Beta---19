"""Surplus plan numbers: emergency fund (3 months of essentials) and how a monthly surplus could be split.

Educational only. It names no financial products and gives no instruction to buy anything.
"""
import math
from statistics import median

from app.config import (EMERGENCY_FUND_MONTHS, ESSENTIAL_CATEGORIES, SURPLUS_DEFAULT_SPLIT, SURPLUS_SPLIT_PRESETS,
                        VARIABLE_MONTHS)
from app.services.insights import category_by_month, planning_surplus
from app.services.stats import percentile

DISCLAIMER = ("For learning only. These are arithmetic on your own statements, not advice. "
              "Consider speaking to a qualified adviser before making financial decisions.")

# General ideas by purpose, with no product names.
OPTIONS = [
    {"title": "Keep it easy to reach", "risk": "Low", "lockIn": "None",
     "bestFor": "An emergency fund and money needed within a year."},
    {"title": "Set it aside for a fixed term", "risk": "Low", "lockIn": "Months to years",
     "bestFor": "A goal with a known date, such as a trip or fees."},
    {"title": "Let it grow over many years", "risk": "Higher: value can fall as well as rise", "lockIn": "Long term",
     "bestFor": "Goals more than 5 years away, after the emergency fund is full."},
    {"title": "Pay down expensive debt first", "risk": "Low", "lockIn": "None",
     "bestFor": "Debt whose interest is higher than what savings would earn."},
]


def essentials(ledger, months):
    """Monthly essentials: median monthly spend per essential category over the last few months."""
    last = months[-VARIABLE_MONTHS:]
    table = category_by_month(ledger, last)
    items = [{"name": c, "monthlyPaise": int(median(table[c].values()))} for c in ESSENTIAL_CATEGORIES if c in table]
    return [i for i in items if i["monthlyPaise"] > 0]


def months_to_fund(shortfall, monthly):
    """Whole months to close the shortfall, 0 if already funded, None if the monthly amount is not positive."""
    if shortfall <= 0:
        return 0
    return math.ceil(shortfall / monthly) if monthly > 0 else None


def surplus_plan(ledger, inp, split=SURPLUS_DEFAULT_SPLIT):
    """GET /api/surplus-plan payload."""
    if len(inp.history_months) < 1:
        return {"insufficientHistory": True, "disclaimer": DISCLAIMER}
    items = essentials(ledger, list(inp.history_months))
    baseline = sum(i["monthlyPaise"] for i in items)
    target, saved = EMERGENCY_FUND_MONTHS * baseline, inp.start_cash
    shortfall = max(0, target - saved)
    surplus = planning_surplus(ledger, inp)
    typical, slow, fast = (int(percentile(surplus, p)) for p in (50, 25, 75))
    def option(pct):
        to_fund = round(typical * pct / 100)
        return {"splitPct": pct, "monthlyToEmergencyPaise": to_fund, "monthlyToOtherGoalsPaise": typical - to_fund,
                "monthsToFund": months_to_fund(shortfall, to_fund)}
    kinds = [k for k in ("regular", "irregular") if inp.profile[k]]
    framework = {"regular": "Salaried", "irregular": "Variable income"}
    return {"insufficientHistory": False, "disclaimer": DISCLAIMER, "asOf": inp.as_of.isoformat(),
            "framework": " + ".join(framework[k] for k in kinds) or "No income found yet",
            "emergencyFund": {"bufferMonths": EMERGENCY_FUND_MONTHS, "monthlyEssentialsPaise": baseline,
                              "essentials": items, "targetPaise": target, "savedPaise": saved,
                              "shortfallPaise": shortfall, "monthsCovered": round(saved / baseline, 1) if baseline else None,
                              "funded": shortfall == 0},
            "surplus": {"typicalPaise": typical, "lowPaise": slow, "highPaise": fast},
            "eta": {"fastestMonths": months_to_fund(shortfall, fast), "slowestMonths": months_to_fund(shortfall, slow)},
            "allocation": {"splitPct": split, "chosen": option(split), "presets": [option(p) for p in SURPLUS_SPLIT_PRESETS]},
            "options": OPTIONS}
