"""Goals: are they on track? Uses the Phase 4 affordability engine.

A goal is on track when the engine says the money still needed can be afforded by its target month.
Goals share one pot of cash, so each goal is checked together with every earlier-due goal
(sorted by target date): 'can I afford A and B by B's date?', not 'B alone'.
"""
import math
from datetime import date
from statistics import median

from app.services.affordability import evaluate
from app.services.forecast import missing_items
from app.services.insights import planning_surplus
from app.services.stats import add_months, month_of

# engine verdict -> goal status
STATUS_OF_VERDICT = {"yes": "on_track", "risky": "tight", "stretch": "off_track", "no": "off_track"}
STATUS_TEXT = {
    "funded": "Fully funded.",
    "on_track": "On track, even if income comes in low.",
    "tight": "Tight: only works if income is typical or better.",
    "off_track": "Off track: not reachable by this date at your current surplus.",
    "overdue": "The target date has passed and the goal is not fully funded.",
    "unknown": "Cannot tell yet: more statement data is needed.",
}


def months_left(as_of, target_date):
    """Whole months from the month after the latest statement to the target month, inclusive. 0 = already past."""
    a, t = month_of(as_of), month_of(target_date)
    return max(0, (int(t[:4]) - int(a[:4])) * 12 + int(t[5:]) - int(a[5:]))


def assess(inp, ledger, goals):
    """Status and numbers for each goal (dicts with name, target_paise, saved_paise, target_date, id)."""
    blocked = missing_items(inp)
    out, claim = [], 0
    for g in sorted(goals, key=lambda g: (g["target_date"], g["id"] or 0)):
        remaining = max(0, g["target_paise"] - g["saved_paise"])
        n = months_left(inp.as_of, g["target_date"])
        entry = {"id": g["id"], "name": g["name"], "targetPaise": g["target_paise"], "savedPaise": g["saved_paise"],
                 "targetDate": g["target_date"], "remainingPaise": remaining, "monthsLeft": n,
                 "category": g.get("category"), "priority": g.get("priority"), "percentFunded": round(g["saved_paise"] * 100 / g["target_paise"], 1),
                 "monthlyNeededPaise": math.ceil(remaining / n) if n else remaining, "verdict": None, "missing": []}
        if remaining == 0:
            entry["status"] = "funded"
        elif n == 0:
            entry["status"] = "overdue"
        elif blocked:
            entry["status"], entry["missing"] = "unknown", blocked
        else:
            claim += remaining
            answer = evaluate(inp, claim, g["target_date"][:7])
            entry["status"] = STATUS_OF_VERDICT[answer["verdict"]["code"]]
            entry["verdict"] = answer["verdict"]["code"]
            entry["leftIfAllGoalsPaidPaise"] = answer["cases"]["typical"]["leftAfterPurchasePaise"]
        entry["statusText"] = STATUS_TEXT[entry["status"]]
        out.append(entry)
    return out


def portfolio(entries, inp, ledger):
    """Totals across goals, including the monthly commitment against the typical monthly surplus.

    shortfall = needed - surplus, only when needed is bigger (never negative); spare = the opposite.
    A shortfall can still leave every goal on track when savings already in the bank cover the gap,
    so allOnTrack is returned too and the screen words the two cases differently.
    """
    saved, target = sum(e["savedPaise"] for e in entries), sum(e["targetPaise"] for e in entries)
    surplus = planning_surplus(ledger, inp)
    typical = int(median(surplus)) if surplus else None
    required = sum(e["monthlyNeededPaise"] for e in entries if e["status"] != "funded")
    on_track = sum(e["status"] in ("on_track", "funded") for e in entries)
    return {"count": len(entries), "savedPaise": saved, "targetPaise": target,
            "fundedPercent": round(saved * 100 / target, 1) if target else 0,
            "monthlyRequiredPaise": required,
            "typicalSurplusPaise": typical,
            "shortfallPaise": max(0, required - typical) if typical is not None else None,
            "sparePaise": max(0, typical - required) if typical is not None else None,
            "allOnTrack": on_track == len(entries),
            "onTrack": on_track}


def valid_date(text):
    """True if text is a real YYYY-MM-DD date."""
    try:
        date.fromisoformat(text)
        return len(text) == 10
    except ValueError:
        return False
