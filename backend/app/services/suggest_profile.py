"""Step 1 of "Suggestions for you": turn a user's data into a tiny anonymous profile.

PRIVACY RULE: this file is the only place that reads the user's money data for the AI feature, and it outputs
only bands and labels. No exact amount, transaction, merchant name, account number, date, goal name, name or email
can come out of build_profile(): every value is picked from a fixed list of labels below. The AI never sees anything else.
"""
import re
from statistics import median

from app import config
from app.services.goals import months_left
from app.services.insights import planning_surplus
from app.services.surplus_plan import essentials

# The only values the "About you" form may hold. Anything else is ignored.
ABOUT_CHOICES = {
    "age_band": ["18–25", "26–35", "36–50", "50+"],
    "dependents": ["none", "1–2", "3+"],
    "risk_comfort": ["low", "medium", "high"],
}
ABOUT_YES_NO = ["employer_health_cover", "has_daughter"]


def surplus_band(rupees):
    """Monthly surplus (rupees) -> a band label."""
    if rupees < 0:
        return config.SURPLUS_BAND_NEGATIVE
    for limit, label in config.SURPLUS_BANDS:
        if rupees < limit:
            return label
    return config.SURPLUS_BAND_TOP


def income_stability(profile):
    """Our existing income classification (regular / irregular sources) as a label."""
    if profile["regular"] and profile["irregular"]:
        return "mostly regular"
    return "regular" if profile["regular"] else "variable"


def emergency_status(saved_paise, monthly_essentials_paise):
    """How many months of essentials the cash on hand covers, as a label."""
    if saved_paise <= 0 or monthly_essentials_paise <= 0:
        return "not started"
    months = saved_paise / monthly_essentials_paise
    if months < 1:
        return "under 1 month"
    return "1–3 months" if months < config.EMERGENCY_FUND_MONTHS else "complete (3+ months)"


def horizon(months):
    """Months until a goal's date -> a horizon label."""
    if months < config.HORIZON_SHORT_MONTHS:
        return "under 1 year"
    return "1–5 years" if months <= config.HORIZON_MEDIUM_MONTHS else "5+ years"


def has_signal(ledger, months, words, category=None):
    """True if any recent transaction's merchant contains one of the words (or is in the category). Only a yes/no leaves."""
    for t in ledger:
        if t["month"] not in months or t["amount_paise"] >= 0:
            continue
        text = t["merchant"].upper()
        if t["category"] == category or any(re.search(rf"\b{re.escape(w)}\b", text) for w in words):
            return True
    return False


def goal_entries(inp, goals):
    """Goals as {horizon, type} only: no name, no amount, no date."""
    out = []
    for g in goals:
        kind = g.get("category") if g.get("category") in config.GOAL_TYPES else "Other"
        out.append({"horizon": horizon(months_left(inp.as_of, g["target_date"])), "type": kind})
    return out


def about_answers(row):
    """The saved 'About you' row -> only valid labels (missing or odd values are left out)."""
    out = {}
    for field, choices in ABOUT_CHOICES.items():
        if row and row.get(field) in choices:
            out[field] = row[field]
    for field in ABOUT_YES_NO:
        if row and row.get(field) in (0, 1):
            out[field] = bool(row[field])
    return out


def build_profile(ledger, inp, goals, about_row):
    """The anonymous profile. Every value is a label from a fixed list or a true/false."""
    months = set(list(inp.history_months)[-config.SIGNAL_MONTHS:])
    surplus = planning_surplus(ledger, inp)
    monthly_surplus_rupees = median(surplus) / 100 if surplus else 0
    baseline = sum(i["monthlyPaise"] for i in essentials(ledger, list(inp.history_months)))
    profile = {
        "monthly_surplus_band": surplus_band(monthly_surplus_rupees),
        "income_stability": income_stability(inp.profile),
        "emergency_fund_status": emergency_status(inp.start_cash, baseline),
        "has_emi": has_signal(ledger, months, [], category="EMI"),
        "high_cost_debt_signal": has_signal(ledger, months, config.HIGH_COST_DEBT_WORDS),
        "goals": goal_entries(inp, goals),
        "existing_cover_signals": {
            "has_life_insurance_premium": has_signal(ledger, months, config.LIFE_INSURANCE_WORDS),
            "has_health_insurance_premium": has_signal(ledger, months, config.HEALTH_INSURANCE_WORDS),
        },
    }
    answers = about_answers(about_row)
    if answers:
        profile["about_you"] = answers
    return profile
