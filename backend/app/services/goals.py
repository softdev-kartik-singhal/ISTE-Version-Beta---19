"""Goals: are they on track? Uses the Phase 4 affordability engine.

A goal is on track when the engine says the money still needed can be afforded by its target month.
Goals share one pot of cash, so each goal is checked together with every earlier-due goal
(sorted by target date): 'can I afford A and B by B's date?', not 'B alone'.
"""
import math
from datetime import date, datetime
from statistics import median

from app.services.affordability import evaluate
from app.services.forecast import missing_items
from app.services.insights import planning_surplus, surplus_range
from app.services.money import inr
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


# ---------------------------------------------------------------- the Goals screen: today-based months and plain statuses
# These sit next to the engine verdicts above (which are unchanged) and answer one question per goal:
# can the user pay ALL goals' monthly amounts together, in a low month, in a usual month, or not at all?

DAYS_PER_MONTH = 30.4375
PUSH_MONTHS = (6, 12, 24)     # how far a nudge may suggest moving a goal's date
PUSH_MIN_FREED_PAISE = 50_000  # a nudge that frees less than Rs 500 a month is not worth showing


def today():
    """Today's date. A function so tests can pin it."""
    return date.today()


def months_from_today(target_date):
    """Months from TODAY to the target date, rounded up (60 days = 2 months). 0 = the date has passed."""
    days = (date.fromisoformat(target_date) - today()).days
    return 0 if days <= 0 else max(1, math.ceil(days / DAYS_PER_MONTH))


def month_label(month):
    """'2026-12' -> 'Dec 2026'."""
    return datetime.strptime(month, "%Y-%m").strftime("%b %Y")


def title_case(text):
    """'new bike' -> 'New Bike'. Words that already have capitals ('iPhone', 'EMI') are left alone. Same rule as the screen."""
    return " ".join(w.capitalize() if w == w.lower() else w for w in text.split())


def plural(n, word):
    return f"{n} {word}{'' if n == 1 else 's'}"


def summary_line(bucket, total, count, usual, low):
    """The sentence under 'Your goals'. It quotes the same numbers the status was decided with."""
    need = f"You need {inr(total)} a month for {plural(count, 'goal')}."
    if bucket == "low_ok":
        return f"{need} Even in a low month you have {inr(low)} left, so you're covered."
    if bucket == "usual_ok":
        return f"{need} In a usual month you have {inr(usual)} left, so you're covered, but a low month ({inr(low)}) would fall short."
    return f"{need} You usually have {inr(usual)} left, which is {inr(total - usual)} a month short."


def goal_view(entries, ledger, inp):
    """Adds the screen's fields to every entry and returns the summary, or None if there is no history yet.

    monthlyNowPaise = still needed / months from today. The bucket compares the TOTAL of those with the low and the
    usual month's surplus. A goal that cannot be met even if the whole usual surplus went to it is 'unreachable'.
    """
    if not inp.history_months:
        return None
    usual, low, good = surplus_range(ledger, inp)
    live = []
    for e in entries:
        n = months_from_today(e["targetDate"])
        e["monthsFromToday"] = n
        e["monthlyNowPaise"] = math.ceil(e["remainingPaise"] / n) if n and e["remainingPaise"] else 0
        if e["remainingPaise"] and n:
            live.append(e)
    total = sum(e["monthlyNowPaise"] for e in live)
    bucket = "none" if not live else "low_ok" if total <= low else "usual_ok" if total <= usual else "needs_more"
    for e in entries:
        e["earliestMonth"] = None
        if not e["remainingPaise"]:
            e["statusCode"] = "funded"
        elif not e["monthsFromToday"]:
            e["statusCode"] = "overdue"
        elif e["monthlyNowPaise"] > usual:
            e["statusCode"] = "unreachable"
            if usual > 0:
                e["earliestMonth"] = add_months(month_of(today()), math.ceil(e["remainingPaise"] / usual))
        else:
            e["statusCode"] = bucket
        e["statusLine"] = status_line(e)
    return {"totalNeedPaise": total, "goalCount": len(live), "lowPaise": low, "usualPaise": usual, "goodPaise": good,
            "bucket": bucket, "summary": summary_line(bucket, total, len(live), usual, low) if live else
            ("All your goals are funded." if entries else "")}


def status_line(e):
    code = e["statusCode"]
    if code == "unreachable":
        return (f"Not reachable by this date \u2014 earliest: {month_label(e['earliestMonth'])}" if e["earliestMonth"]
                else "Not reachable by this date at your current surplus")
    return {"funded": "Fully funded", "overdue": "The target date has passed", "low_ok": "On track even in a low month",
            "usual_ok": "On track in a usual month", "needs_more": "Needs more"}[code]


def nudges(entries, inp, view, limit=2):
    """Up to two suggestions worked out in code: move a goal's date to free money each month, or use a past bonus."""
    if not view or not view["goalCount"]:
        return []
    live = [e for e in entries if e["remainingPaise"] and e["monthsFromToday"]]
    out = []
    if view["bucket"] != "low_ok":
        goal = max(live, key=lambda e: e["monthlyNowPaise"])
        goal_target = view["lowPaise"] if view["bucket"] == "usual_ok" else view["usualPaise"]
        options = []
        for push in PUSH_MONTHS:
            freed = goal["monthlyNowPaise"] - math.ceil(goal["remainingPaise"] / (goal["monthsFromToday"] + push))
            options.append((push, freed))
        # the smallest push that gets all goals within reach; otherwise the biggest one
        push, freed = next(((p, f) for p, f in options if view["totalNeedPaise"] - f <= goal_target), options[-1])
        if freed >= PUSH_MIN_FREED_PAISE:
            out.append({"kind": "push", "goalId": goal["id"], "months": push, "freedPaise": freed,
                        "text": f"Move {title_case(goal['name'])} to {month_label(add_months(month_of(goal['targetDate']), push))} to free {inr(freed)} a month."})
    if inp.one_offs and len(out) < limit:
        bonus = max(inp.one_offs, key=lambda o: o["paise"])
        fits = [e for e in live if e["remainingPaise"] <= bonus["paise"]]
        if fits:
            goal = min(fits, key=lambda e: e["remainingPaise"])
            out.append({"kind": "bonus", "goalId": goal["id"], "amountPaise": bonus["paise"],
                        "text": f"A bonus like your {inr(bonus['paise'])} one in {month_label(month_of(bonus['date']))} could finish {title_case(goal['name'])} in one go."})
    return out[:limit]
