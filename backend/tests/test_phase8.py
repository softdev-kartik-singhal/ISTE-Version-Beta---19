"""Backend gaps for the real-data frontend: demo login, statement list/delete, transaction fields, dashboard extras."""
import pytest

from app import config
from tests.conftest import EMAIL, PASSWORD


def headers(token):
    return {"Authorization": f"Bearer {token}"}


def demo_headers(anon):
    return headers(anon.post("/api/auth/demo").json()["token"])


# ---------- demo account ----------

def test_demo_login_creates_the_account_and_loads_the_dataset_once(anon):
    h = demo_headers(anon)
    first = anon.get("/api/statements", headers=h).json()
    assert len(first["files"]) == 3 and first["merge"]["records"] > 200
    demo_headers(anon)                                                     # second login: nothing is loaded twice
    assert anon.get("/api/statements", headers=h).json()["merge"]["records"] == first["merge"]["records"]
    ok = anon.post("/api/auth/login", json={"email": config.DEMO_EMAIL, "password": config.DEMO_PASSWORD})
    assert ok.status_code == 200


def test_an_emptied_demo_account_is_refilled_on_login(anon, db_path):
    anon.post("/api/auth/demo")
    import sqlite3
    uid = sqlite3.connect(db_path).execute("SELECT id FROM users WHERE email = ?", (config.DEMO_EMAIL,)).fetchone()[0]
    sqlite3.connect(db_path).execute("DELETE FROM uploaded_files WHERE user_id = ?", (uid,)).connection.commit()
    sqlite3.connect(db_path).execute("DELETE FROM transactions").connection.commit()
    assert anon.get("/api/transactions", headers=demo_headers(anon)).json()["total"] > 0     # empty demo account is refilled...


def test_a_new_user_starts_empty_and_never_sees_the_demo_users_data(anon):
    demo = demo_headers(anon)
    token = anon.post("/api/auth/signup", json={"name": "N", "email": "n@x.in", "password": "long enough pw"}).json()["token"]
    new = headers(token)
    assert anon.get("/api/session", headers=new).json()["hasData"] is False
    assert anon.get("/api/transactions", headers=new).json()["total"] == 0
    assert anon.get("/api/dashboard", headers=new).json()["insufficientHistory"] is True
    assert anon.get("/api/transactions", headers=demo).json()["total"] > 0


def test_the_shared_demo_account_cannot_be_deleted(anon):
    assert anon.delete("/api/data", headers=demo_headers(anon)).status_code == 403


# ---------- statements ----------

def test_statement_files_carry_name_type_and_duplicate_value(client):
    client.post("/api/demo-data?set=eight_months")
    files = {f["name"]: f for f in client.get("/api/statements").json()["files"]}
    assert files["bank_a_jul_sep.csv"]["type"] == "csv" and files["bank_a_jul_sep.csv"]["duplicateRows"] == 5
    assert files["bank_a_jul_sep.csv"]["duplicatePaise"] > 0 and files["bank_a_feb_jul.csv"]["duplicatePaise"] == 0


def test_account_numbers_in_file_names_are_masked(client):
    csv = b"Account No,50100123451234\nDate,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n01/02/2026,X,1.00,,5.00\n"
    client.post("/api/upload", files={"file": ("stmt_50100123451234.csv", csv)})
    assert client.get("/api/statements").json()["files"][0]["name"] == "stmt_••••••••••1234.csv"


def test_deleting_a_statement_removes_its_rows_and_rematches_transfers(complete):
    files = complete.get("/api/statements").json()["files"]
    kotak = next(f for f in files if f["bank"] == "Kotak")
    before = complete.get("/api/transactions").json()["total"]
    after = complete.delete(f"/api/statements/{kotak['id']}").json()
    assert after["merge"]["records"] == before - kotak["newRows"] and len(after["files"]) == 2
    assert complete.get("/api/transactions", params={"kind": "transfer"}).json()["total"] == 0       # no counterpart left
    assert complete.delete(f"/api/statements/{kotak['id']}").status_code == 404


def test_one_user_cannot_delete_anothers_statement(complete, anon):
    fid = complete.get("/api/statements").json()["files"][0]["id"]
    other = headers(anon.post("/api/auth/signup", json={"name": "O", "email": "o@x.in", "password": "long enough pw"}).json()["token"])
    assert anon.delete(f"/api/statements/{fid}", headers=other).status_code == 404
    assert len(complete.get("/api/statements").json()["files"]) == 3


# ---------- transactions ----------

def test_direction_filter_channel_and_reference(complete):
    debits = complete.get("/api/transactions", params={"direction": "debit", "limit": 500}).json()["transactions"]
    credits = complete.get("/api/transactions", params={"direction": "credit", "limit": 500}).json()["transactions"]
    assert all(t["amountPaise"] < 0 for t in debits) and all(t["amountPaise"] > 0 for t in credits) and credits
    swiggy = complete.get("/api/transactions", params={"q": "SWIGGY"}).json()["transactions"][0]
    assert swiggy["channel"] == "UPI" and swiggy["reference"]
    emi = complete.get("/api/transactions", params={"q": "EMI"}).json()["transactions"][0]
    assert emi["channel"] == "Auto-debit" and emi["reference"] is None
    assert complete.get("/api/transactions", params={"direction": "sideways"}).status_code == 422


# ---------- dashboard extras, flags, goals, learning ----------

def test_dashboard_has_split_projection_and_counts(complete):
    d = complete.get("/api/dashboard").json()
    sp = d["spending"]
    assert sp["month"] == "2026-09" and sp["totalPaise"] == sum(c["amountPaise"] for c in sp["categories"])
    assert sp["fixedPaise"] == 2_800_000 + 1_450_000 and sp["flexiblePaise"] == sp["totalPaise"] - sp["fixedPaise"]
    assert d["analyzedTransactions"] > 20 and d["surplusVsPrevPaise"] is not None
    p = d["projection"]
    assert len(p) == 8 and all(w["worst"] <= w["typical"] <= w["best"] for w in p) and d["bufferPaise"] == 4_334_300
    assert p[0]["weekStart"] > d["asOf"]


def test_projection_missing_without_enough_history(client):
    client.post("/api/demo-data?set=short_2mo")
    assert client.get("/api/dashboard").json()["projection"] is None


def test_flags_carry_usual_amount_and_original_date(complete):
    flags = complete.get("/api/flags").json()["flags"]
    large = next(f for f in flags if f["type"] == "large")
    dup = next(f for f in flags if f["type"] == "duplicate")
    assert large["usualPaise"] == 249_900 and dup["originalDate"] == "2026-05-18"


def test_goal_category_and_priority_round_trip(complete):
    body = {"name": "Phone", "targetPaise": 8_000_000, "targetDate": "2026-12-31", "category": "Hardware", "priority": "High"}
    goal = complete.post("/api/goals", json=body).json()["goals"][0]
    assert (goal["category"], goal["priority"]) == ("Hardware", "High")
    body["priority"] = "Low"
    assert complete.put(f"/api/goals/{goal['id']}", json=body).json()["goals"][0]["priority"] == "Low"


def test_learning_counts_corrections(complete):
    assert complete.get("/api/track-record").json()["learning"] == {"corrections": 0, "merchantsRemembered": 0, "rowsRecategorised": 0}
    blinkit = complete.get("/api/transactions", params={"q": "BLINKIT"}).json()["transactions"][0]["id"]
    groceries = next(c["id"] for c in complete.get("/api/categories").json() if c["name"] == "Groceries")
    complete.post(f"/api/transactions/{blinkit}/category", json={"categoryId": groceries})
    assert complete.get("/api/track-record").json()["learning"] == {"corrections": 1, "merchantsRemembered": 1, "rowsRecategorised": 4}


def test_session_lists_account_ids(complete):
    s = complete.get("/api/session").json()
    assert s["hasData"] is True and [a["bank"] for a in s["accountList"]] == ["HDFC", "Kotak"]
