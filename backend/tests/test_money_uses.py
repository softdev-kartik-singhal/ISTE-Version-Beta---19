"""Ways to use money: fixed deposit, recurring deposit and insurance figures follow the user's own numbers."""
import math
from dataclasses import replace

import pytest

from app import config
from app.db import connect
from app.services.forecast import build_inputs
from app.services.insights import load_ledger
from app.services.money_uses import fd_interest, rd_value, ways_to_use_money


def ways(db_path, start_cash=None, **rates):
    conn = connect(db_path)
    inp, ledger = build_inputs(conn, 1), load_ledger(conn, 1)
    return ways_to_use_money(ledger, replace(inp, start_cash=start_cash) if start_cash is not None else inp, **rates)


# ---------------------------------------------------------------- the formulas
def test_fd_interest_is_compound_interest_over_the_years():
    assert fd_interest(1_000_000, 7) == 70_000
    assert fd_interest(1_000_000, 7, years=2) == round(1_000_000 * (1.07 ** 2 - 1))
    assert fd_interest(0, 7) == 0 and fd_interest(1_000_000, 0) == 0


def test_rd_value_matches_a_month_by_month_simulation():
    monthly, rate = 3_420_000, 6.5
    balance = 0.0
    for _ in range(12):
        balance = balance * (1 + rate / 1200) + monthly           # deposit at each month end, interest on what is already there
    assert rd_value(monthly, rate) == pytest.approx(balance, abs=2)
    assert rd_value(monthly, 0) == monthly * 12


# ---------------------------------------------------------------- the user's numbers
def test_cash_above_the_safety_net_is_what_a_deposit_could_use(complete, db_path):
    out = ways(db_path)
    base, fd = out["base"], out["fd"]
    assert base["funded"] is True and base["spareAboveSafetyNetPaise"] == base["savedPaise"] - base["targetPaise"] > 0
    assert fd["amountPaise"] == base["spareAboveSafetyNetPaise"]
    assert fd["interestYearPaise"] == fd_interest(fd["amountPaise"], config.EXAMPLE_FD_RATE_PCT)
    assert fd["savingsInterestPaise"] == fd_interest(fd["amountPaise"], config.EXAMPLE_SAVINGS_RATE_PCT)
    assert fd["extraPaise"] == fd["interestYearPaise"] - fd["savingsInterestPaise"] > 0
    assert fd["totalAfterYearPaise"] == fd["amountPaise"] + fd["interestYearPaise"]


def test_nothing_is_offered_for_a_deposit_until_the_safety_net_is_full(complete, db_path):
    out = ways(db_path, start_cash=1_000_000)
    assert out["base"]["funded"] is False and out["base"]["spareAboveSafetyNetPaise"] == 0
    assert out["fd"]["amountPaise"] == 0 and out["fd"]["interestYearPaise"] == 0
    rd = out["rd"]                                               # the recurring deposit then helps fill the net
    assert rd["fillsSafetyNetInMonths"] == math.ceil(out["base"]["shortfallPaise"] / rd["monthlyPaise"])


def test_recurring_deposit_uses_a_share_of_the_usual_leftover(complete, db_path):
    out = ways(db_path)
    rd, leftover = out["rd"], out["base"]["monthlyLeftoverPaise"]
    assert rd["monthlyPaise"] == round(leftover * config.RD_SHARE_PCT / 100) and rd["sharePct"] == config.RD_SHARE_PCT
    assert rd["depositedPaise"] == rd["monthlyPaise"] * 12
    assert rd["totalPaise"] == rd_value(rd["monthlyPaise"], config.EXAMPLE_RD_RATE_PCT)
    assert rd["interestPaise"] == rd["totalPaise"] - rd["depositedPaise"] > 0
    assert rd["fillsSafetyNetInMonths"] is None                  # the net is already full


def test_cover_figures_come_from_the_users_own_essential_spending(complete, db_path):
    out = ways(db_path)
    p = out["policy"]
    conn = connect(db_path)
    from app.services.surplus_plan import surplus_plan
    essentials = surplus_plan(load_ledger(conn, 1), build_inputs(conn, 1))["emergencyFund"]["monthlyEssentialsPaise"]
    assert p["annualEssentialsPaise"] == essentials * 12
    assert p["lifeCoverPaise"] == p["annualEssentialsPaise"] * config.COVER_YEARS_OF_ESSENTIALS
    assert p["hasLifePremium"] is False and p["hasHealthPremium"] is False   # the demo statements show no premiums
    assert p["billShareOfSavingsPct"] == round(config.EXAMPLE_HOSPITAL_BILL_PAISE * 100 / out["base"]["savedPaise"])


def test_example_rates_can_be_changed_and_are_checked(complete):
    base = complete.get("/api/ways-to-use-money").json()
    high = complete.get("/api/ways-to-use-money", params={"fd_rate": 9, "rd_rate": 8}).json()
    assert base["rates"]["fd"] == config.EXAMPLE_FD_RATE_PCT and high["rates"] == {"fd": 9.0, "rd": 8.0, "savings": config.EXAMPLE_SAVINGS_RATE_PCT}
    assert high["fd"]["interestYearPaise"] > base["fd"]["interestYearPaise"] and high["rd"]["totalPaise"] > base["rd"]["totalPaise"]
    for bad in ({"fd_rate": 99}, {"rd_rate": -1}):
        assert complete.get("/api/ways-to-use-money", params=bad).status_code == 422


def test_no_statements_means_no_answer(client):
    assert client.get("/api/ways-to-use-money").json()["insufficientHistory"] is True


def test_users_are_separate(complete):
    token = complete.post("/api/auth/signup", json={"name": "Other", "email": "other.ways@example.com", "password": "Test-pass-2026!"}).json()["token"]
    assert complete.get("/api/ways-to-use-money", headers={"Authorization": f"Bearer {token}"}).json()["insufficientHistory"] is True


def test_the_answer_names_no_product_or_provider(complete):
    import re
    text = str(complete.get("/api/ways-to-use-money").json()).upper()
    assert not re.search(r"\b(HDFC|SBI|ICICI|LIC|PPF|SIP|MUTUAL|GUARANTEE)\b", text)
