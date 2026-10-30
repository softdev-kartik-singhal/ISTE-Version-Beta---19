"""Phase 4 tests: stats, question parser, sufficiency refusals, affordability steps, verdicts, what-if."""
from dataclasses import replace
from datetime import date

import pytest

from app.config import BUFFER_MONTHS, CASES
from app.db import connect
from app.services.affordability import confidence_of, evaluate, occurrences_in_month
from app.services.forecast import build_inputs, history_months
from app.services.question import find_amounts, parse_question
from app.services.stats import add_months, month_end, months_between, percentile

AS_OF = date(2026, 9, 28)


# ---------- stats ----------

@pytest.mark.parametrize("values,p,expected", [
    ([1, 2, 3, 4, 5], 50, 3), ([10, 20], 50, 15), ([0, 100], 10, 10), ([0, 100], 90, 90),
    ([5], 90, 5), ([], 50, 0), ([3, 1, 2], 0, 1), ([3, 1, 2], 100, 3),
])
def test_percentile(values, p, expected):
    assert percentile(values, p) == pytest.approx(expected)


def test_month_helpers():
    assert add_months("2026-11", 3) == "2027-02" and add_months("2026-01", -1) == "2025-12"
    assert months_between("2026-11", "2027-01") == ["2026-11", "2026-12", "2027-01"]
    assert month_end("2026-02") == date(2026, 2, 28)


# ---------- question parser ----------

@pytest.mark.parametrize("text,amount,month", [
    ("Can I afford an ₹80,000 phone next month?", 8_000_000, "2026-10"),
    ("buy a laptop for 80k in December", 8_000_000, "2026-12"),
    ("Can I take a ₹45,000 Goa trip in Dec?", 4_500_000, "2026-12"),
    ("spend 80000 on a TV in January", 8_000_000, "2027-01"),
    ("I want a 1.5 lakh bike in 2 months", 15_000_000, "2026-11"),
    ("Rs. 25,000 shoes next month", 2_500_000, "2026-10"),
    ("May I buy a ₹10,000 watch next month?", 1_000_000, "2026-10"),   # 'May I' is not the month
    ("a ₹9,000 fan in May", 900_000, "2027-05"),
    ("a ₹9,000 fan in September", 900_000, "2027-09"),                  # same month as the statements -> next year
    ("a phone for INR 60,000 in March 2028", 6_000_000, "2028-03"),
])
def test_parser_understands(text, amount, month):
    p = parse_question(text, AS_OF)
    assert (p["amountPaise"], p["targetMonth"], p["missing"]) == (amount, month, [])


def test_parser_reports_what_is_missing():
    assert parse_question("Is ₹80,000 ok in 2026?", AS_OF)["missing"] == ["month"]        # a year is not money
    assert parse_question("can I go on a trip next month", AS_OF)["missing"] == ["amount"]
    assert parse_question("hello", AS_OF)["missing"] == ["amount", "month"]


def test_parser_refuses_to_guess_between_two_amounts():
    p = parse_question("pay ₹5,000 now and ₹80,000 later next month", AS_OF)
    assert p["amountPaise"] is None and p["missing"] == ["amount"]
    assert [c["paise"] for c in p["amountCandidates"]] == [500_000, 8_000_000]


def test_months_and_emis_are_not_money():
    assert find_amounts("a 12 EMI plan over 24 months for 3000") == [("3000", 300_000)]


# ---------- fixtures ----------

@pytest.fixture
def complete(client):
    client.post("/api/demo-data?set=eight_months_complete")
    return client


def ask(client, amount=8_000_000, month="2026-10"):
    return client.post("/api/ask", json={"amountPaise": amount, "targetMonth": month}).json()


# ---------- ask flow ----------

def test_question_only_returns_parsed_fields_for_confirmation(complete):
    r = complete.post("/api/ask", json={"question": "Can I afford an ₹80,000 phone next month?"}).json()
    assert r["status"] == "needs_confirmation" and r["parsed"]["amountPaise"] == 8_000_000
    assert r["parsed"]["targetMonth"] == "2026-10"
    assert complete.post("/api/ask", json={"question": "a trip"}).json()["status"] == "needs_input"


def test_bad_requests_422(complete):
    assert complete.post("/api/ask", json={"amountPaise": 0, "targetMonth": "2026-10"}).status_code == 422
    assert complete.post("/api/ask", json={"amountPaise": 5, "targetMonth": "Dec"}).status_code == 422
    assert complete.post("/api/ask", json={"amountPaise": 5, "targetMonth": "2026-09"}).status_code == 422  # not in the future
    assert "2026-10" in complete.post("/api/ask", json={"amountPaise": 5, "targetMonth": "2026-08"}).json()["detail"]["reason"]


# ---------- sufficiency ----------

def test_gap_over_seven_days_refuses_and_names_it(client):
    client.post("/api/demo-data?set=eight_months")
    r = ask(client)
    assert r["status"] == "insufficient_data" and [m["code"] for m in r["missing"]] == ["GAP"]
    gap = r["missing"][0]
    assert "Kotak ••5678" in gap["message"] and gap["days"] >= 10 and gap["from"] < "2026-08-11" < "2026-08-20" < gap["to"]


def test_two_months_refuses(client):
    client.post("/api/demo-data?set=short_2mo")
    r = ask(client)
    assert r["status"] == "insufficient_data" and [m["code"] for m in r["missing"]] == ["HISTORY"]
    assert "found 2" in r["missing"][0]["message"] and "at least 3" in r["missing"][0]["message"]


def test_empty_account_lists_every_missing_item(client):
    r = ask(client)
    assert [m["code"] for m in r["missing"]] == ["HISTORY", "INCOME", "BALANCE"]


def test_history_months_only_counts_complete_months():
    assert history_months(date(2026, 2, 1), date(2026, 9, 28)) == months_between("2026-02", "2026-09")
    assert history_months(date(2026, 2, 12), date(2026, 9, 28))[0] == "2026-03"      # started mid-month
    assert history_months(date(2026, 2, 1), date(2026, 9, 15))[-1] == "2026-08"      # ended mid-month


# ---------- income classification ----------

def test_income_classes(complete):
    income = ask(complete)["income"]
    assert [r["merchant"] for r in income["regular"]] == ["ACME TECH PVT LTD-SALARY"]
    assert [r["merchant"] for r in income["irregular"]] == ["FREELANCE CLIENT"]
    (bonus,) = income["oneOff"]
    assert bonus["paise"] == 12_000_000 and bonus["date"] == "2026-02-14"
    total = sum(income["monthlyPaise"].values())          # the bonus is in no month's total
    assert total == income["regular"][0]["totalPaise"] + income["irregular"][0]["totalPaise"]
    assert income["regular"][0]["occurrences"] == 8


# ---------- affordability steps ----------

def test_cases_use_p10_median_p90_and_every_step_adds_up(complete):
    r = ask(complete)
    monthly = list(r["income"]["monthlyPaise"].values())
    assert len(monthly) == 8
    for name, (pct, _) in CASES.items():
        c = r["cases"][name]
        assert c["incomePaise"] == round(percentile(monthly, pct))
        assert c["headroomPaise"] == (c["startingCashPaise"] + c["incomePaise"] - c["committedPaise"]
                                      - c["variablePaise"] - c["bufferPaise"])
        assert c["leftAfterPurchasePaise"] == c["headroomPaise"] - c["pricePaise"]
    h = [r["cases"][n]["headroomPaise"] for n in ("worst", "typical", "best")]
    assert h[0] < h[1] < h[2]


def test_committed_is_recurring_due_in_target_month(complete):
    r = ask(complete)
    assert r["months"] == ["2026-10"]
    assert {c["merchant"]: c["paise"] for c in r["committed"]} == {
        "RENT": 2_800_000, "HDFC LTD-EMI": 1_450_000, "NETFLIX.COM": 64_900, "SPOTIFY INDIA": 11_900, "APPLE ICLOUD": 7_500}
    assert r["cases"]["typical"]["committedPaise"] == 4_334_300
    assert r["cases"]["typical"]["bufferPaise"] == round(BUFFER_MONTHS * 4_334_300)


def test_variable_spend_is_last_three_months_without_recurring_or_the_june_purchase(complete):
    var = ask(complete)["variableByCategory"]
    assert "Rent" not in var and "EMI" not in var                       # committed, not variable
    assert all(v["high"] < 8_200_000 for v in var.values())             # Croma (June) is outside Jul-Sep
    assert all(v["low"] <= v["median"] <= v["high"] for v in var.values())
    typical = ask(complete)["cases"]["typical"]["variablePaise"]
    assert typical == sum(v["median"] for v in var.values())


def test_longer_horizon_sums_every_month(complete):
    r = ask(complete, month="2026-12")
    assert r["months"] == ["2026-10", "2026-11", "2026-12"]
    one = ask(complete)["cases"]["typical"]
    c = r["cases"]["typical"]
    assert c["incomePaise"] == 3 * one["incomePaise"] and c["variablePaise"] == 3 * one["variablePaise"]
    assert c["committedPaise"] == 3 * one["committedPaise"] and c["bufferPaise"] == one["bufferPaise"]


# ---------- verdicts ----------

def test_each_verdict_band(complete):
    h = [ask(complete, 1)["cases"][n]["headroomPaise"] for n in ("worst", "typical", "best")]
    expect = [(h[0] - 1, "yes"), (h[0] + 1, "risky"), (h[1] + 1, "stretch"), (h[2] + 1, "no")]
    for price, code in expect:
        assert ask(complete, price)["verdict"]["code"] == code


def test_phone_is_affordable_in_every_case(complete):
    r = ask(complete)
    assert r["verdict"]["code"] == "yes" and all(c["affordable"] for c in r["cases"].values())


# ---------- confidence ----------

def test_confidence_levels(complete, db_path):
    r = ask(complete)
    assert r["confidence"]["label"] == "Medium" and "ncome varies" in r["confidence"]["reason"]
    steady = replace(build_inputs(connect(db_path), 1), monthly_income=(9_500_000,) * 8)
    out = evaluate(steady, 8_000_000, "2026-10")
    assert out["confidence"]["label"] == "High"
    far = evaluate(steady, 8_000_000, "2026-12")
    assert far["confidence"]["label"] == "Medium" and "3 months ahead" in far["confidence"]["reason"]
    short = replace(steady, history_months=steady.history_months[:4], monthly_income=(9_500_000,) * 4)
    assert "nly 4 months" in confidence_of(short, out["cases"], 8_000_000, 1)["reason"]


def test_borderline_result_loses_confidence(complete, db_path):
    steady = replace(build_inputs(connect(db_path), 1), monthly_income=(9_500_000,) * 8)
    typical = evaluate(steady, 1, "2026-10")["cases"]["typical"]["headroomPaise"]
    out = evaluate(steady, typical, "2026-10")                           # leaves exactly Rs 0
    assert out["confidence"]["label"] == "Medium" and "close to the line" in out["confidence"]["reason"]


# ---------- bonus scenario ----------

def test_bonus_scenario_adds_the_one_off_once(complete):
    r = ask(complete)
    b = r["bonusScenario"]
    assert b["oneOff"]["paise"] == 12_000_000
    for name in CASES:
        assert b["cases"][name]["headroomPaise"] - r["cases"][name]["headroomPaise"] == 12_000_000


def test_no_bonus_scenario_without_a_one_off(complete, db_path):
    inp = replace(build_inputs(connect(db_path), 1), one_offs=())
    assert evaluate(inp, 8_000_000, "2026-10")["bonusScenario"] is None


# ---------- recurring dates ----------

def test_occurrences_in_month():
    monthly = {"cadence_days": 30, "last_seen": "2026-09-05"}
    weekly = {"cadence_days": 7, "last_seen": "2026-09-28"}
    yearly = {"cadence_days": 365, "last_seen": "2025-12-10"}
    assert occurrences_in_month(monthly, "2026-10") == 1
    assert occurrences_in_month(weekly, "2026-10") == 4                  # Oct 5, 12, 19, 26
    assert occurrences_in_month(yearly, "2026-12") == 1 and occurrences_in_month(yearly, "2026-11") == 0
    assert occurrences_in_month({**monthly, "start": "2026-12"}, "2026-10") == 0


# ---------- what-if ----------

def what_if(client, **body):
    return client.post("/api/what-if", json={"amountPaise": 8_000_000, "targetMonth": "2026-10", **body})


def test_cancelling_a_subscription_frees_exactly_its_cost(complete):
    r = what_if(complete, cancelRecurring=["netflix.com"]).json()          # name match ignores case
    for name in CASES:
        # one month of Netflix not paid, and the one-month buffer shrinks by the same amount
        assert r["changePaise"][name] == 64_900 * 2
    assert r["modified"]["committed"] != r["original"]["committed"]
    assert r["original"]["cases"]["typical"]["headroomPaise"] == ask(complete)["cases"]["typical"]["headroomPaise"]


def test_adding_an_emi_over_three_months(complete):
    r = what_if(complete, targetMonth="2026-12", addEmi={"name": "Bike EMI", "amountPaise": 1_000_000}).json()
    for name in CASES:
        # paid in Oct, Nov, Dec; buffer grows by one month's worth
        assert r["changePaise"][name] == -(3_000_000 + 1_000_000)
    assert "Bike EMI" in [c["merchant"] for c in r["modified"]["committed"]]


def test_emi_start_month_is_respected(complete):
    r = what_if(complete, targetMonth="2026-12", addEmi={"amountPaise": 1_000_000, "startMonth": "2026-12"}).json()
    assert [c["count"] for c in r["modified"]["committed"] if c["merchant"] == "New EMI"] == [1]


def test_what_if_can_flip_the_verdict(complete):
    h = ask(complete, 1)["cases"]["typical"]["headroomPaise"]
    r = what_if(complete, amountPaise=h + 10_000, cancelRecurring=["NETFLIX.COM"]).json()
    assert r["original"]["verdict"]["code"] == "stretch" and r["modified"]["verdict"]["code"] == "risky"
    assert r["verdictChanged"] is True


def test_what_if_errors_and_refusals(complete, client):
    bad = what_if(complete, cancelRecurring=["HOTSTAR"])
    assert bad.status_code == 422 and "HOTSTAR" in bad.json()["detail"]["reason"] and "NETFLIX.COM" in bad.json()["detail"]["known"]
    assert what_if(complete, addEmi={"amountPaise": 0}).status_code == 422
    assert what_if(complete, targetMonth="2026-09").status_code == 422


def test_what_if_refuses_without_enough_data(client):
    client.post("/api/demo-data?set=short_2mo")
    assert what_if(client).json()["status"] == "insufficient_data"
