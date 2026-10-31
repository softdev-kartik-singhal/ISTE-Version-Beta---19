"""The account selector: every money view can be narrowed to one account with ?account=<id>, and the views of
the separate accounts add back up to the whole."""
import pytest


@pytest.fixture
def banks(complete):
    """The two bank accounts of the demo data (id, label)."""
    accounts = [a for a in complete.get("/api/session").json()["accountList"] if a["type"] != "cash"]
    assert len(accounts) == 2
    return accounts


def get(client, path, account=None, **params):
    if account is not None:
        params["account"] = account
    return client.get(path, params=params)


def test_cash_in_hand_is_per_account_and_adds_up(complete, banks):
    total = get(complete, "/api/dashboard").json()["cashPaise"]
    parts = [get(complete, "/api/dashboard", a["id"]).json()["cashPaise"] for a in banks]
    assert sum(parts) == total and len(set(parts)) == 2 and all(p > 0 for p in parts)


def test_monthly_money_in_and_out_add_up_across_accounts(complete, banks):
    whole = get(complete, "/api/trends").json()["months"]
    per = [get(complete, "/api/trends", a["id"]).json()["months"] for a in banks]
    for i, month in enumerate(whole):                                  # transfers between own accounts are left out everywhere
        assert sum(p[i]["inflowPaise"] for p in per) == month["inflowPaise"]
        assert sum(p[i]["outflowPaise"] for p in per) == month["outflowPaise"]


def test_one_account_shows_only_its_own_payments_and_regular_bills(complete, banks):
    hdfc = next(a for a in banks if a["bank"] == "HDFC")
    kotak = next(a for a in banks if a["bank"] == "Kotak")
    merchants = lambda a: {i["merchant"] for i in get(complete, "/api/recurring", a["id"]).json()["items"]}
    assert "RENT" in merchants(hdfc) and "RENT" not in merchants(kotak)      # rent is paid from the HDFC account
    assert any("NETFLIX" in m for m in merchants(kotak)) and not any("NETFLIX" in m for m in merchants(hdfc))
    assert merchants(hdfc) | merchants(kotak) >= {i["merchant"] for i in get(complete, "/api/recurring").json()["items"]} - {"ACME TECH PVT LTD-SALARY"}


def test_flags_belong_to_their_account_and_add_up(complete, banks):
    every = get(complete, "/api/flags").json()["flags"]
    per = [get(complete, "/api/flags", a["id"]).json()["flags"] for a in banks]
    assert sorted(f["id"] for f in every) == sorted(f["id"] for p in per for f in p)
    for account, flags in zip(banks, per):
        assert all(f["account"] == f"{account['bank']} ••{account['last4']}" for f in flags)


def test_every_money_view_accepts_the_filter_and_changes_with_it(complete, banks):
    a = banks[0]["id"]
    for path in ("/api/dashboard", "/api/trends", "/api/money-flow", "/api/surplus-plan", "/api/survival", "/api/ways-to-use-money", "/api/goals"):
        assert get(complete, path, a).status_code == 200, path
    assert get(complete, "/api/survival", a).json()["cashPaise"] != get(complete, "/api/survival").json()["cashPaise"]
    assert get(complete, "/api/surplus-plan", a).json()["emergencyFund"]["savedPaise"] != get(complete, "/api/surplus-plan").json()["emergencyFund"]["savedPaise"]


def test_ask_uses_the_selected_accounts_money(complete, banks):
    hdfc = next(a for a in banks if a["bank"] == "HDFC")
    body = {"amountPaise": 5_000_000, "targetMonth": "2026-10"}
    whole = complete.post("/api/ask", json=body).json()
    one = complete.post("/api/ask", params={"account": hdfc["id"]}, json=body).json()
    assert whole["status"] == "answered"
    assert one["startingCashPaise"] != whole["startingCashPaise"] if one["status"] == "answered" else one["status"] == "insufficient_data"


def test_an_unknown_or_someone_elses_account_is_a_404(complete):
    assert get(complete, "/api/dashboard", 999_999).status_code == 404
    token = complete.post("/api/auth/signup", json={"name": "Other", "email": "other.filter@example.com", "password": "Test-pass-2026!"}).json()["token"]
    mine = [a for a in complete.get("/api/session").json()["accountList"]][0]["id"]
    other = complete.get("/api/dashboard", params={"account": mine}, headers={"Authorization": f"Bearer {token}"})
    assert other.status_code == 404


def test_the_session_always_lists_every_account_and_only_narrows_the_flag_count(complete, banks):
    whole = complete.get("/api/session").json()
    for a in banks:
        s = complete.get("/api/session", params={"account": a["id"]}).json()
        assert s["accountList"] == whole["accountList"]
        assert s["flagCount"] == len(get(complete, "/api/flags", a["id"]).json()["flags"])
    assert complete.get("/api/session", params={"account": 999_999}).json()["flagCount"] == whole["flagCount"]   # unknown: ignored
