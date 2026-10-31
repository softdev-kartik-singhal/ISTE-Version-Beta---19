"""Cash wallet: ATM withdrawals are transfers, so recorded cash is counted once; leftovers become 'Cash — not recorded'."""
from datetime import date, timedelta

import pytest

from app import config
from app.db import connect
from app.services.insights import load_ledger

DAY = lambda d: d.strftime("%d/%m/%Y")
TODAY = date.today()


def statement(rows):
    """An HDFC-style CSV. rows = (date, narration, withdrawal, deposit, balance)."""
    lines = ["Account No,50100123451234", "Date,Narration,Withdrawal Amt,Deposit Amt,Closing Balance"]
    lines += [f"{DAY(d)},{n},{w or ''},{dep or ''},{b}" for d, n, w, dep, b in rows]
    return "\n".join(lines).encode()


def upload(client, rows):
    assert client.post("/api/upload", files={"file": ("s.csv", statement(rows))}).status_code in (200, 201)


def outflow(client):
    return client.get("/api/transactions?limit=500").json()["summary"]["outflowPaise"]


def spend(client, paise, category, **extra):
    return client.post("/api/cash", json={"type": "spent", "amountPaise": paise, "category": category, **extra})


@pytest.fixture
def atm(client):
    """A salary and one ₹1,000 ATM withdrawal 5 days ago."""
    upload(client, [(TODAY - timedelta(days=9), "NEFT CR-ACME SALARY", None, "50000.00", "50000.00"),
                    (TODAY - timedelta(days=5), "ATM WDL 0123 MG ROAD", "1000.00", None, "49000.00")])
    return client


def test_atm_withdrawal_plus_recorded_spends_count_once(atm):
    assert outflow(atm) == 0  # the withdrawal alone is a transfer to the wallet, not spending
    assert spend(atm, 60000, "Travel & Commute").status_code == 201
    assert spend(atm, 40000, "Food & Dining").status_code == 201
    assert outflow(atm) == 100000  # ₹1,000, not ₹2,000
    wallet = atm.get("/api/cash").json()["wallet"]
    assert wallet["balancePaise"] == 0 and wallet["withdrawnPaise"] == 100000


def test_cash_received_is_income_and_a_deposit_is_not(client):
    upload(client, [(TODAY - timedelta(days=9), "NEFT CR-ACME SALARY", None, "50000.00", "50000.00"),
                    (TODAY - timedelta(days=4), "CASH DEP BRANCH 22", None, "3000.00", "53000.00")])
    inflow = lambda: client.get("/api/transactions?limit=500").json()["summary"]["inflowPaise"]
    assert inflow() == 5000000  # the ₹3,000 cash deposit is a wallet -> bank transfer, not income
    r = client.post("/api/cash", json={"type": "received", "amountPaise": 200000, "sourceType": "gift"})
    assert r.status_code == 201 and inflow() == 5200000  # a cash gift is income
    wallet = client.get("/api/cash").json()["wallet"]
    assert wallet["depositedPaise"] == 300000 and wallet["receivedPaise"] == 200000
    assert wallet["balancePaise"] == 200000 - 300000  # received - deposited (no withdrawal)


def test_unrecorded_cash_after_30_days_counts_as_spending(client, db_path):
    old = TODAY - timedelta(days=45)
    upload(client, [(old - timedelta(days=3), "NEFT CR-ACME SALARY", None, "50000.00", "50000.00"),
                    (old, "ATM WDL 0123 MG ROAD", "1000.00", None, "49000.00")])
    spend(client, 60000, "Travel & Commute", date=old.isoformat())  # only ₹600 of the ₹1,000 is recorded
    with connect(db_path) as conn:
        ledger = load_ledger(conn, 1)
    lost = [r for r in ledger if r["category"] == config.UNRECORDED_CATEGORY]
    assert len(lost) == 1 and lost[0]["amount_paise"] == -40000 and lost[0]["month"] == old.isoformat()[:7]
    wallet = client.get("/api/cash").json()["wallet"]
    assert wallet["balancePaise"] == 40000 and wallet["countedAsSpendingPaise"] == 40000
    spend(client, 40000, "Food & Dining", date=old.isoformat())  # the user fixes it by adding the missing entry
    with connect(db_path) as conn:
        assert not [r for r in load_ledger(conn, 1) if r["category"] == config.UNRECORDED_CATEGORY]


def test_recent_leftover_is_not_yet_spending(atm, db_path):
    with connect(db_path) as conn:
        assert not [r for r in load_ledger(conn, 1) if r["category"] == config.UNRECORDED_CATEGORY]
    assert atm.get("/api/cash").json()["wallet"]["balancePaise"] == 100000  # still shown as cash in hand


def test_deleting_a_manual_entry_updates_balance_and_totals(atm):
    entry = spend(atm, 60000, "Travel & Commute").json()["entry"]
    assert outflow(atm) == 60000 and atm.get("/api/cash").json()["wallet"]["balancePaise"] == 40000
    atm.delete(f"/api/cash/{entry['id']}")
    assert outflow(atm) == 0 and atm.get("/api/cash").json()["wallet"]["balancePaise"] == 100000


def test_edit_changes_amount_and_category(atm):
    entry = spend(atm, 60000, "Travel & Commute").json()["entry"]
    atm.patch(f"/api/cash/{entry['id']}", json={"amountPaise": 70000, "category": "Food & Dining", "note": "lunch"})
    shown = next(e for e in atm.get("/api/cash").json()["entries"] if e["id"] == entry["id"])
    assert (shown["amountPaise"], shown["category"], shown["note"]) == (70000, "Food & Dining", "lunch")


def test_split_withdrawal_into_categories(atm):
    w = atm.get("/api/cash").json()["withdrawals"][0]
    assert w["unaccountedPaise"] == 100000
    r = atm.post("/api/cash/split-withdrawal", json={"withdrawalId": w["id"], "parts": [
        {"amountPaise": 60000, "category": "Travel & Commute"}, {"amountPaise": 40000, "category": "Food & Dining"}]})
    assert r.status_code == 201 and outflow(atm) == 100000
    assert atm.get("/api/cash").json()["withdrawals"][0]["unaccountedPaise"] == 0
    too_much = atm.post("/api/cash/split-withdrawal", json={"withdrawalId": w["id"], "parts": [{"amountPaise": 200000, "category": "Travel & Commute"}]})
    assert too_much.status_code == 422


def test_likely_duplicate_warns_but_is_kept(atm):
    first = spend(atm, 40000, "Food & Dining", date=TODAY.isoformat()).json()
    again = spend(atm, 40000, "Food & Dining", date=TODAY.isoformat()).json()
    assert first["duplicateWarning"] is False and again["duplicateWarning"] is True
    assert len(atm.get("/api/cash").json()["entries"]) == 2


def test_bad_entries_and_other_users_rows(atm, anon):
    assert spend(atm, 1000, "Not a category").status_code == 422
    assert atm.post("/api/cash", json={"type": "received", "amountPaise": 1000, "sourceType": "lottery"}).status_code == 422
    assert spend(atm, 1000, "Food & Dining", date="2999-01-01").status_code == 422
    entry = spend(atm, 1000, "Food & Dining").json()["entry"]
    token = anon.post("/api/auth/signup", json={"name": "Other", "email": "other@example.com", "password": "correct horse battery"}).json()["token"]
    other = {"Authorization": f"Bearer {token}"}
    assert anon.delete(f"/api/cash/{entry['id']}", headers=other).status_code == 404


def test_cash_rows_stay_out_of_flags_recurring_and_statement_counts(atm):
    for _ in range(3):
        spend(atm, 40000, "Food & Dining")
    assert atm.get("/api/flags").json()["openCount"] == 0
    assert atm.get("/api/statements").json()["merge"]["accounts"] == 1  # the wallet is not a statement account
    assert any(a.get("type") == "cash" for a in atm.get("/api/session").json()["accountList"])


def test_ai_profile_never_carries_notes(complete, monkeypatch):
    complete.post("/api/cash", json={"type": "spent", "amountPaise": 5000, "category": "Food & Dining", "note": "secret birthday gift for Anu"})
    from app.services import suggest_ai
    seen = []
    monkeypatch.setattr(suggest_ai, "ask_ai", lambda profile: seen.append(profile) or {"suggestions": []})
    complete.post("/api/suggestions", json={})
    assert "secret" not in str(seen) and "Anu" not in str(seen)
