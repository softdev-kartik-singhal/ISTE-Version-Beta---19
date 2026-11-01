"""Suggestions for you: the profile is anonymous, the AI answer is checked, and the rule-based fallback works."""
import json
import re

import pytest

from app import config
from app.services import suggest_ai, suggestions
from app.services.suggest_rules import PRODUCTS, claims_unknown_fact, rule_based, rule_item, validate

CLEAN = {"product_type": "recurring deposit", "priority": 1, "why_it_fits": "Your emergency fund is under 1 month.",
         "what_to_check": "Compare lock-in and premature withdrawal rules.", "risk_level": "low", "suits_goal_horizon": "under 1 year"}
PROFILE = {"monthly_surplus_band": "₹10k–20k", "income_stability": "regular", "emergency_fund_status": "under 1 month",
           "has_emi": False, "high_cost_debt_signal": False, "goals": [],
           "existing_cover_signals": {"has_life_insurance_premium": False, "has_health_insurance_premium": False}}


@pytest.fixture
def sent(monkeypatch):
    """Records whatever would be sent to the AI and answers with a clean suggestion."""
    log = []
    monkeypatch.setattr(suggest_ai, "ask_ai", lambda profile: log.append(profile) or {"suggestions": [CLEAN]})
    return log


# ---------------------------------------------------------------- the profile
def all_strings(value):
    if isinstance(value, dict):
        return [s for v in value.values() for s in all_strings(v)]
    if isinstance(value, list):
        return [s for v in value for s in all_strings(v)]
    return [value] if isinstance(value, str) else []


def test_profile_has_only_bands_and_labels(complete, sent):
    complete.post("/api/goals", json={"name": "Secret Laptop Fund", "targetPaise": 12345600, "savedPaise": 99900,
                                       "targetDate": "2027-03-31", "category": "Work & Equipment"})
    complete.put("/api/suggestions/about", json={"age_band": "26–35", "risk_comfort": "medium"})
    reply = complete.post("/api/suggestions", json={}).json()
    profile = sent[0]
    assert profile == reply["profile"]  # what the panel shows is exactly what was sent

    text = json.dumps(profile, ensure_ascii=False)
    rows = complete.get("/api/transactions?limit=500").json()["transactions"]
    for row in rows:
        assert row["merchant"].upper() not in text.upper()  # no merchant names
        assert row["last4"] not in text  # no account numbers
    assert not re.search(r"\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4}", text)  # no dates
    for private in ("Tester", "tester@example.com", "Secret Laptop Fund", "12345600", "123456", "99900", "50100123451234"):
        assert private not in text

    # every value is one of the fixed labels
    labels = {"negative", "regular", "mostly regular", "variable", "not started", "under 1 month", "1–3 months", "complete (3+ months)",
              "under 1 year", "1–5 years", "5+ years", "26–35", "medium", *config.GOAL_TYPES, *[b[1] for b in config.SURPLUS_BANDS],
              config.SURPLUS_BAND_TOP}
    assert set(all_strings(profile)) <= labels
    assert profile["goals"] == [{"horizon": "1–5 years", "type": "Work & Equipment"}] or profile["goals"][0].keys() == {"horizon", "type"}


def test_unknown_goal_type_is_sent_as_other(complete, sent):
    complete.post("/api/goals", json={"name": "x", "targetPaise": 100000, "targetDate": "2030-01-31", "category": "Mum's surprise party"})
    complete.post("/api/suggestions", json={})
    assert sent[0]["goals"][0]["type"] == "Other"


# ---------------------------------------------------------------- the safety checks
def test_validator_drops_brands_return_percentages_and_unknown_types():
    bad = [
        {**CLEAN, "why_it_fits": "HDFC has a good deposit."},                     # brand
        {**CLEAN, "why_it_fits": "It earns 7.5% a year."},                       # return percentage
        {**CLEAN, "what_to_check": "Expect 8 percent returns."},                 # return percentage in words
        {**CLEAN, "why_it_fits": "Guaranteed to grow."},                         # a promise
        {**CLEAN, "product_type": "Bitcoin"},                                    # not on the allowed list
        {**CLEAN, "product_type": "LIC Jeevan Anand"},                           # a brand as a product
    ]
    assert validate({"suggestions": bad}, PROFILE) == []
    kept = validate({"suggestions": bad + [CLEAN]}, PROFILE)
    assert [k["product_type"] for k in kept] == ["recurring deposit"]


def test_validator_sets_risk_itself_and_drops_sukanya_without_a_daughter():
    liar = {**CLEAN, "product_type": "index fund SIP", "risk_level": "low"}
    sukanya = {**CLEAN, "product_type": "Sukanya Samriddhi"}
    out = validate({"suggestions": [liar, sukanya, CLEAN]}, PROFILE)
    assert {i["product_type"]: i["risk_level"] for i in out}["index fund SIP"] == PRODUCTS["index fund SIP"][0]
    assert "Sukanya Samriddhi" not in [i["product_type"] for i in out]
    with_daughter = {**PROFILE, "about_you": {"has_daughter": True}}
    assert "Sukanya Samriddhi" in [i["product_type"] for i in validate({"suggestions": [sukanya]}, with_daughter)]


def test_order_rules_are_forced_in_code():
    sip = {**CLEAN, "product_type": "index fund SIP"}
    term = {**CLEAN, "product_type": "term life insurance"}
    debt_profile = {**PROFILE, "high_cost_debt_signal": True}
    out = validate({"suggestions": [sip, term]}, debt_profile)  # the AI forgot debt and the emergency fund
    types = [i["product_type"] for i in out]
    assert types[0] == "paying down high-cost debt first"
    assert types[1] == "savings account sweep"  # emergency savings next, before cover and investing
    assert types.index("term life insurance") < types.index("index fund SIP")
    assert [i["priority"] for i in out] == list(range(1, len(out) + 1))


def test_at_most_five_suggestions():
    many = [{**CLEAN, "product_type": p} for p in PRODUCTS]
    assert len(validate({"suggestions": many}, {**PROFILE, "about_you": {"has_daughter": True}})) <= 5


# ---------------------------------------------------------------- the fallback
def test_fallback_when_the_ai_call_fails(complete, monkeypatch):
    def boom(profile):
        raise suggest_ai.AIUnavailable("timed out")
    monkeypatch.setattr(suggest_ai, "ask_ai", boom)
    reply = complete.post("/api/suggestions", json={}).json()
    assert reply["source"] == "rules" and reply["note"] == "Suggestions based on simple rules"
    assert reply["suggestions"] and reply["sharedWithAI"] is False


def test_fallback_when_the_ai_answer_is_rubbish(complete, monkeypatch):
    monkeypatch.setattr(suggest_ai, "ask_ai", lambda profile: {"suggestions": [{**CLEAN, "why_it_fits": "Earn 9% with HDFC."}]})
    assert complete.post("/api/suggestions", json={}).json()["source"] == "rules"


def test_fallback_when_no_key_is_configured(complete, monkeypatch):
    monkeypatch.setattr(config, "GEMINI_API_KEY", None)
    monkeypatch.setattr(config, "AI_PROVIDER", "gemini")
    assert complete.post("/api/suggestions", json={}).json()["source"] == "rules"


def test_rule_based_follows_the_order():
    profile = {**PROFILE, "high_cost_debt_signal": True, "goals": [{"horizon": "5+ years", "type": "Home"}]}
    types = [i["product_type"] for i in rule_based(profile)]
    assert types[0] == "paying down high-cost debt first" and types[1] == "savings account sweep"
    assert all(i["product_type"] in PRODUCTS for i in rule_based(profile))


# ---------------------------------------------------------------- cache and about-you
def test_identical_profile_does_not_call_the_ai_again(complete, sent):
    first = complete.post("/api/suggestions", json={}).json()
    second = complete.post("/api/suggestions", json={}).json()
    assert len(sent) == 1 and second["cached"] is True and second["suggestions"] == first["suggestions"]
    complete.post("/api/suggestions", json={"refresh": True})
    assert len(sent) == 2  # refresh asks again


def test_about_you_is_saved_per_user_and_validated(complete):
    complete.put("/api/suggestions/about", json={"age_band": "26–35", "dependents": "oops", "has_daughter": True})
    assert complete.get("/api/suggestions/about").json() == {"age_band": "26–35", "has_daughter": True}


def test_no_statements_means_no_suggestions(client):
    assert client.post("/api/suggestions", json={}).json()["insufficientHistory"] is True


# ---------------------------------------------------------------- never assume what the user did not say
def test_ai_text_that_assumes_unsaid_facts_is_dropped():
    said_nothing = {**PROFILE, "about_you": {}}
    for text in ("People depend on your income.", "Your family would need it.", "Your daughter's future is covered.",
                 "Your employer may already cover you.", "You are comfortable with ups and downs.", "At your age, start early."):
        assert validate({"suggestions": [{**CLEAN, "why_it_fits": text}]}, said_nothing) == [], text
    told = {**PROFILE, "about_you": {"dependents": "1–2", "has_daughter": True, "employer_health_cover": False, "risk_comfort": "high", "age_band": "26–35"}}
    for text in ("People depend on your income.", "Your daughter's future is covered.", "Your employer cover may not be enough.",
                 "You are comfortable with ups and downs.", "At your age, start early."):
        assert len(validate({"suggestions": [{**CLEAN, "why_it_fits": text}]}, told)) >= 1, text


def test_rule_text_never_claims_dependents_the_user_did_not_give():
    emi_only = {**PROFILE, "has_emi": True, "about_you": {}, "existing_cover_signals": {"has_life_insurance_premium": False, "has_health_insurance_premium": True}}
    term = next(i for i in rule_based(emi_only) if i["product_type"] == "term life insurance")
    assert "depend" not in term["why_it_fits"].lower() and "EMI" in term["why_it_fits"]
    with_dependents = {**emi_only, "about_you": {"dependents": "1–2"}}
    term = next(i for i in rule_based(with_dependents) if i["product_type"] == "term life insurance")
    assert "You said people depend on your income" in term["why_it_fits"]


def test_every_rule_text_is_free_of_unsaid_facts():
    said_nothing = {**PROFILE, "about_you": {}}
    for product in PRODUCTS:
        item = rule_item(product, said_nothing)
        if product in ("Sukanya Samriddhi", "debt/liquid fund", "index fund SIP", "NPS", "health insurance (family floater)"):
            continue  # these are only ever picked when the user gave the matching answer
        assert not claims_unknown_fact(item, {}), product
