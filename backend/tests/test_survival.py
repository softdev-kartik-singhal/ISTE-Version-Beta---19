"""Job-loss planner: months the cash would last with no income, and what stopping each non-essential expense adds."""
from dataclasses import replace

import pytest

from app.config import ESSENTIAL_CATEGORIES
from app.db import connect
from app.services.forecast import build_inputs
from app.services.insights import load_ledger
from app.services.survival import months_lasting, survival, usual_monthly_spend


@pytest.fixture
def payload(complete):
    return complete.get("/api/survival").json()


def test_months_are_cash_over_monthly_spending(payload):
    assert payload["insufficientHistory"] is False
    assert payload["monthsNow"] == pytest.approx(payload["cashPaise"] / payload["monthlySpendPaise"])
    assert payload["monthlySpendPaise"] > 0 and payload["monthsNow"] > 0


def test_each_stop_adds_months_by_the_same_formula(payload):
    cash, burn, now = payload["cashPaise"], payload["monthlySpendPaise"], payload["monthsNow"]
    assert payload["cuts"], "the demo data has non-essential spending"
    for c in payload["cuts"]:
        assert c["monthsIfStopped"] == pytest.approx(cash / (burn - c["monthlyPaise"]))
        assert c["addsMonths"] == pytest.approx(c["monthsIfStopped"] - now) and c["addsMonths"] > 0
    saved = [c["monthlyPaise"] for c in payload["cuts"]]
    assert saved == sorted(saved, reverse=True)                   # biggest saving first


def test_essentials_are_never_offered_as_something_to_stop(payload):
    names = {c["name"] for c in payload["cuts"]}
    assert not names & set(ESSENTIAL_CATEGORIES)
    assert {e["name"] for e in payload["essentials"]} <= set(ESSENTIAL_CATEGORIES)


def test_stopping_everything_leaves_exactly_the_essentials(payload):
    essentials = sum(e["monthlyPaise"] for e in payload["essentials"])
    assert payload["leanMonthlySpendPaise"] == essentials
    assert payload["monthsLean"] == pytest.approx(payload["cashPaise"] / essentials)
    assert payload["monthsLean"] > payload["monthsNow"]
    assert payload["monthlySpendPaise"] - sum(c["monthlyPaise"] for c in payload["cuts"]) == essentials


def test_subscriptions_are_listed_one_by_one_and_not_counted_twice(complete, db_path):
    conn = connect(db_path)
    ledger, inp = load_ledger(conn, 1), build_inputs(conn, 1)
    usual = usual_monthly_spend(ledger, inp.history_months)
    out = survival(ledger, inp)
    subs = [c for c in out["cuts"] if c["kind"] == "subscription"]
    assert {c["name"] for c in subs} >= {"NETFLIX.COM", "SPOTIFY INDIA"}
    in_cuts = sum(c["monthlyPaise"] for c in out["cuts"] if c["kind"] == "subscription" or c["name"] == "Other subscriptions")
    assert in_cuts == usual["Subscriptions"]                       # the category total, split up: no double count


def test_a_flagged_one_off_is_left_out_of_the_usual_month():
    month = lambda m, p, anomaly=False: {"month": m, "txn_date": f"{m}-10", "amount_paise": p, "merchant": "M", "category": "Shopping", "anomaly": anomaly}
    ledger = [month("2026-07", -300_000), month("2026-08", -300_000), month("2026-08", -8_200_000, True), month("2026-09", -300_000)]
    assert usual_monthly_spend(ledger, ["2026-07", "2026-08", "2026-09"]) == {"Shopping": 300_000}


def test_no_cash_means_no_months_and_no_spending_means_no_answer(complete, db_path):
    conn = connect(db_path)
    ledger, inp = load_ledger(conn, 1), build_inputs(conn, 1)
    broke = survival(ledger, replace(inp, start_cash=0))
    assert broke["monthsNow"] == 0 and all(c["monthsIfStopped"] == 0 for c in broke["cuts"])
    assert months_lasting(500, 0) is None and months_lasting(-5, 100) == 0


def test_no_statements_means_insufficient_history(client):
    assert client.get("/api/survival").json()["insufficientHistory"] is True


def test_survival_is_per_user(complete):
    token = complete.post("/api/auth/signup", json={"name": "Other", "email": "other.survival@example.com", "password": "Test-pass-2026!"}).json()["token"]
    other = complete.get("/api/survival", headers={"Authorization": f"Bearer {token}"}).json()
    assert other["insufficientHistory"] is True
