"""Step 3 of "Suggestions for you": the safety net around the AI, plus the rule-based fallback.

Nothing the AI says reaches the user until it passes validate(). The same file builds the simple rule-based set
that is used when the AI is off, slow or wrong, so the feature always works and always follows the same order:
high-cost debt first, then an emergency fund, then insurance cover, then goal-based saving and investing.
"""
import re

from app import config

# The only product types a suggestion may use. Value = (risk level, goal horizon it suits, group for ordering).
PRODUCTS = {
    "paying down high-cost debt first": ("low", "under 1 year", "debt"),
    "savings account sweep": ("low", "under 1 year", "emergency"),
    "recurring deposit": ("low", "under 1 year", "emergency"),
    "fixed deposit (under 1 year)": ("low", "under 1 year", "emergency"),
    "fixed deposit (1–3 years)": ("low", "1–5 years", "goal"),
    "fixed deposit (3+ years)": ("low", "1–5 years", "goal"),
    "term life insurance": ("low", "5+ years", "cover"),
    "health insurance (individual)": ("low", "5+ years", "cover"),
    "health insurance (family floater)": ("low", "5+ years", "cover"),
    "health insurance (top-up)": ("low", "5+ years", "cover"),
    "debt/liquid fund": ("medium", "under 1 year", "goal"),
    "PPF": ("low", "5+ years", "goal"),
    "NPS": ("medium", "5+ years", "goal"),
    "Sukanya Samriddhi": ("low", "5+ years", "goal"),
    "index fund SIP": ("high", "5+ years", "goal"),
}
ALLOWED = list(PRODUCTS)
HORIZONS = ["under 1 year", "1–5 years", "5+ years"]
EMERGENCY_PRODUCTS = [p for p, v in PRODUCTS.items() if v[2] == "emergency"]
FIELDS = ("product_type", "priority", "why_it_fits", "what_to_check", "risk_level", "suits_goal_horizon")

BRAND = re.compile(r"\b(" + "|".join(re.escape(w) for w in config.BRAND_WORDS) + r")\b", re.I)
PERCENT = re.compile(r"\d\s*(%|percent|per cent|p\.a)|%", re.I)  # anything that looks like a return figure
PROMISE = re.compile("|".join(config.PROMISE_PATTERNS), re.I)

# Plain wording for each product, used by the rule-based set.
TEXT = {
    "paying down high-cost debt first": ("Your spending shows signs of costly debt, which usually outweighs what savings earn.", "Check the interest rate and any early repayment charge."),
    "savings account sweep": ("Your emergency fund is still small, so easy access matters most.", "Compare how quickly you can withdraw and any minimum balance."),
    "recurring deposit": ("A fixed monthly amount builds your emergency fund steadily.", "Compare lock-in and premature withdrawal rules."),
    "fixed deposit (under 1 year)": ("A short deposit keeps money safe for a goal that is close.", "Compare lock-in and premature withdrawal rules."),
    "fixed deposit (1–3 years)": ("A medium deposit suits a goal with a known date.", "Compare lock-in and premature withdrawal rules."),
    "fixed deposit (3+ years)": ("A longer deposit suits money you will not need for years.", "Compare lock-in and premature withdrawal rules."),
    "term life insurance": ("No life cover shows in your payments.", "Check the cover amount, term and exclusions."),
    "health insurance (individual)": ("No health cover shows in your payments and a hospital bill could use up savings.", "Check waiting periods, room limits and exclusions."),
    "health insurance (family floater)": ("You have dependents and no health cover shows in your payments.", "Check waiting periods, room limits and exclusions."),
    "health insurance (top-up)": ("A top-up adds cover on top of what you already have.", "Check the deductible and waiting periods."),
    "debt/liquid fund": ("Your goal is near and you are comfortable with a little ups and downs.", "Check the exit rules and that value can still change."),
    "PPF": ("A long, tax-friendly lock-in suits a goal many years away.", "Check the lock-in and withdrawal rules."),
    "NPS": ("A retirement-focused option for a goal many years away.", "Check how much you can withdraw and when."),
    "Sukanya Samriddhi": ("You said you have a daughter, and this is a long-term saving option for her.", "Check the age limits and withdrawal rules."),
    "index fund SIP": ("A long horizon and higher risk comfort suit steady investing.", "Check costs and that value can fall as well as rise."),
}


# ---------------------------------------------------------------- validation
def has_forbidden_text(item):
    """True if any text in the suggestion names a brand, quotes a return figure or promises something."""
    text = " ".join(str(item.get(f, "")) for f in ("product_type", "why_it_fits", "what_to_check", "suits_goal_horizon"))
    return bool(BRAND.search(text) or PERCENT.search(text) or PROMISE.search(text))


# Words that state a fact about the user, and the "About you" answer each one needs. If the user chose
# "Prefer not to say" (the answer is missing), the text must not talk as if they had said it.
CLAIMS = [
    (re.compile(r"\b(depend\w*|dependants?|children|kids|spouse|your family)\b", re.I), lambda a: a.get("dependents") in ("1–2", "3+")),
    (re.compile(r"\b(daughter|girl child)\b", re.I), lambda a: a.get("has_daughter") is True),
    (re.compile(r"\b(employer|your company|workplace)\b", re.I), lambda a: "employer_health_cover" in a),
    (re.compile(r"\b(comfortable|comfort with|risk appetite|risk tolerance|your appetite)\b", re.I), lambda a: "risk_comfort" in a),
    (re.compile(r"\b(your age|young|older|retire\w*)\b", re.I), lambda a: "age_band" in a),
]


def claims_unknown_fact(item, about):
    """True if the suggestion's reason states something about the user that they did not tell us."""
    text = " ".join(str(item.get(f, "")) for f in ("why_it_fits", "what_to_check"))
    return any(pattern.search(text) and not known(about) for pattern, known in CLAIMS)


def clean_item(raw):
    """One AI suggestion -> a safe one, or None if it must be dropped."""
    if not isinstance(raw, dict) or raw.get("product_type") not in PRODUCTS:
        return None  # not on the allowed list
    if not all(isinstance(raw.get(f), str) for f in ("why_it_fits", "what_to_check")) or has_forbidden_text(raw):
        return None
    risk, horizon, _ = PRODUCTS[raw["product_type"]]  # risk is set by us, not trusted from the AI
    suits = raw.get("suits_goal_horizon") if raw.get("suits_goal_horizon") in HORIZONS else horizon
    return {"product_type": raw["product_type"], "priority": 0, "why_it_fits": raw["why_it_fits"].strip()[:220],
            "what_to_check": raw["what_to_check"].strip()[:140], "risk_level": risk, "suits_goal_horizon": suits}


def rule_item(product, profile=None):
    """A suggestion built from our own wording. The reason only mentions facts the user gave us or our own data."""
    risk, horizon, _ = PRODUCTS[product]
    why, check = TEXT[product]
    if product == "term life insurance" and profile:
        if profile.get("about_you", {}).get("dependents") in ("1–2", "3+"):
            why = "You said people depend on your income, and no life cover shows in your payments."
        elif profile.get("has_emi"):
            why = "You pay an EMI that would still be due if your income stopped, and no life cover shows in your payments."
    return {"product_type": product, "priority": 0, "why_it_fits": why, "what_to_check": check, "risk_level": risk, "suits_goal_horizon": horizon}


def enforce_order(items, profile):
    """Apply the order rules in code, whatever the AI said: debt, then emergency fund, then cover, then goals."""
    about = profile.get("about_you", {})
    items = [i for i in items if not (i["product_type"] == "Sukanya Samriddhi" and not about.get("has_daughter"))]
    seen, unique = set(), []
    for i in items:  # one suggestion per product type
        if i["product_type"] not in seen:
            seen.add(i["product_type"])
            unique.append(i)
    group = lambda i: PRODUCTS[i["product_type"]][2]
    rank = {"debt": 0, "emergency": 1, "cover": 2, "goal": 3}
    unique.sort(key=lambda i: rank[group(i)])  # stable: the AI's own order is kept inside each group
    if profile["high_cost_debt_signal"] and not any(group(i) == "debt" for i in unique):
        unique.insert(0, rule_item("paying down high-cost debt first", profile))
    if profile["emergency_fund_status"] != "complete (3+ months)" and not any(group(i) == "emergency" for i in unique):
        unique.insert(1 if profile["high_cost_debt_signal"] else 0, rule_item("savings account sweep", profile))
    unique = unique[:config.MAX_SUGGESTIONS]
    for n, i in enumerate(unique, 1):
        i["priority"] = n
    return unique


def validate(ai_json, profile):
    """AI answer (parsed JSON) -> safe, ordered suggestions. Returns [] if nothing usable survived."""
    raw = ai_json.get("suggestions") if isinstance(ai_json, dict) else None
    if not isinstance(raw, list):
        return []
    about = profile.get("about_you", {})
    items = [c for c in (clean_item(r) for r in raw[:config.MAX_SUGGESTIONS * 2]) if c and not claims_unknown_fact(c, about)]
    return enforce_order(items, profile) if items else []


# ---------------------------------------------------------------- fallback
def rule_based(profile):
    """Simple rules over the same profile: used when the AI is unavailable or its answer is rejected."""
    about = profile.get("about_you", {})
    cover = profile["existing_cover_signals"]
    picks = []
    if profile["high_cost_debt_signal"]:
        picks.append("paying down high-cost debt first")
    status = profile["emergency_fund_status"]
    if status in ("not started", "under 1 month"):
        picks.append("savings account sweep")
    elif status == "1–3 months":
        picks.append("recurring deposit")
    has_dependents = about.get("dependents") in ("1–2", "3+")
    if not cover["has_health_insurance_premium"] and not about.get("employer_health_cover"):
        picks.append("health insurance (family floater)" if has_dependents else "health insurance (individual)")
    if not cover["has_life_insurance_premium"] and (has_dependents or profile["has_emi"]):
        picks.append("term life insurance")
    if profile["monthly_surplus_band"] != config.SURPLUS_BAND_NEGATIVE:
        picks += goal_picks(profile, about)
    return enforce_order([rule_item(p, profile) for p in dict.fromkeys(picks)], profile)


def goal_picks(profile, about):
    """Goal-based products by horizon and the user's comfort with risk."""
    horizons = {g["horizon"] for g in profile["goals"]}
    if not horizons and profile["emergency_fund_status"] == "complete (3+ months)":
        horizons = {"5+ years"}  # no goals yet and the safety net is full: long-term saving is the natural next step
    risk = about.get("risk_comfort", "low")
    picks = []
    if "under 1 year" in horizons:
        picks.append("fixed deposit (under 1 year)")
    if "1–5 years" in horizons:
        picks.append("fixed deposit (1–3 years)" if risk == "low" else "debt/liquid fund")
    if "5+ years" in horizons:
        picks.append("index fund SIP" if risk == "high" else "PPF")
        if about.get("age_band") in ("26–35", "36–50"):
            picks.append("NPS")
    if about.get("has_daughter"):
        picks.append("Sukanya Samriddhi")
    return picks
