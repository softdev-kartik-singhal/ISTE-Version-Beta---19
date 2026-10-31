"""Phase 7 tests: auth, sessions, the card, the 60-second sensitive window, export and delete."""
import hashlib
import sqlite3

import pytest

from app import config, security
from tests.conftest import EMAIL, PASSWORD

DEVICE = {"X-Device-Secret": "test-device-secret"}
UID = "04:A2:19:4F:2A"
OTHER_UID = "04:B7:55:10:9C"


# ---------- helpers ----------

def signup(client, email="other@example.com", password="another long pass"):
    """Sign up another user; returns the headers that act as them."""
    token = client.post("/api/auth/signup", json={"name": "Other", "email": email, "password": password}).json()["token"]
    return {"Authorization": f"Bearer {token}"}


def register_card(client, uid=UID, headers=None):
    """Browser opens a register request, the ESP32 posts the tap. Returns (request id, device response)."""
    rid = client.post("/api/card/register/start", json={}, headers=headers).json()["requestId"]
    return rid, client.post("/api/card/register", json={"uid": uid}, headers=DEVICE)


def verify_both(client, password=PASSWORD, uid=UID, headers=None):
    """Step 1 password, step 2 card tap. Returns the device response."""
    client.post("/api/auth/verify-password", json={"password": password}, headers=headers)
    client.post("/api/card/verify/start", headers=headers)
    return client.post("/api/card/verify", json={"uid": uid}, headers=DEVICE)


def dump(db_path):
    return "\n".join(sqlite3.connect(db_path).iterdump())


@pytest.fixture
def clock(monkeypatch):
    """Frozen time that tests can move forward."""
    start, state = security.now(), {"offset": 0}
    monkeypatch.setattr(security, "now", lambda: start + state["offset"])
    return lambda seconds: state.update(offset=state["offset"] + seconds)


@pytest.fixture
def with_card(client):
    register_card(client)
    return client


# ---------- signup / login ----------

def test_signup_stores_a_bcrypt_hash_and_only_a_token_hash(anon, db_path):
    r = anon.post("/api/auth/signup", json={"name": "Asha", "email": "Asha@Example.com", "password": "s3cret-pass"})
    assert r.status_code == 201 and r.json()["user"]["email"] == "asha@example.com"
    text = dump(db_path)
    token = r.json()["token"]
    assert "s3cret-pass" not in text and token not in text and security.token_hash(token) in text
    stored = sqlite3.connect(db_path).execute("SELECT password_hash FROM users").fetchone()[0]
    assert stored.startswith("$2") and security.check_password("s3cret-pass", stored)


@pytest.mark.parametrize("body,fragment", [
    ({"name": "A", "email": "a@x.in", "password": "short"}, "at least 8"),
    ({"name": "A", "email": "a@x.in", "password": "é" * 40}, "72 bytes"),
    ({"name": "A", "email": "not-an-email", "password": "long enough pw"}, "valid email"),
    ({"name": "  ", "email": "a@x.in", "password": "long enough pw"}, "Name is required"),
])
def test_signup_validation(anon, body, fragment):
    r = anon.post("/api/auth/signup", json=body)
    assert r.status_code == 422 and fragment in r.json()["detail"]["reason"]


def test_duplicate_email_is_refused_whatever_the_case(client):
    r = client.post("/api/auth/signup", json={"name": "X", "email": EMAIL.upper(), "password": "long enough pw"})
    assert r.status_code == 409


def test_login_works_and_wrong_details_look_identical(anon):
    anon.post("/api/auth/signup", json={"name": "A", "email": "a@x.in", "password": "long enough pw"})
    ok = anon.post("/api/auth/login", json={"email": "A@X.in", "password": "long enough pw"})
    assert ok.status_code == 200 and ok.json()["token"].startswith("sg_")
    wrong_pw = anon.post("/api/auth/login", json={"email": "a@x.in", "password": "nope nope nope"})
    no_user = anon.post("/api/auth/login", json={"email": "ghost@x.in", "password": "nope nope nope"})
    assert wrong_pw.status_code == no_user.status_code == 401 and wrong_pw.json() == no_user.json()


def test_token_works_until_logout(anon):
    headers = signup(anon)
    assert anon.get("/api/session", headers=headers).status_code == 200
    assert anon.post("/api/auth/logout", headers=headers).json() == {"signedOut": True}
    assert anon.get("/api/session", headers=headers).status_code == 401


def test_session_expires(client, clock):
    assert client.get("/api/session").status_code == 200
    clock(config.SESSION_HOURS * 3600 + 1)
    assert client.get("/api/session").status_code == 401


def test_login_is_locked_after_repeated_wrong_passwords(anon, clock):
    anon.post("/api/auth/signup", json={"name": "A", "email": "a@x.in", "password": "long enough pw"})
    bad = lambda: anon.post("/api/auth/login", json={"email": "a@x.in", "password": "wrong wrong"}).status_code
    assert [bad() for _ in range(config.LOGIN_MAX_FAILURES)] == [401] * config.LOGIN_MAX_FAILURES
    assert anon.post("/api/auth/login", json={"email": "a@x.in", "password": "long enough pw"}).status_code == 429   # even the right one
    clock(config.LOGIN_LOCK_SECONDS + 1)
    assert anon.post("/api/auth/login", json={"email": "a@x.in", "password": "long enough pw"}).status_code == 200


def test_password_reset_answers_the_same_for_any_address(anon):
    assert anon.post("/api/auth/reset", json={"email": "nobody@x.in"}).json() == {"sentTo": "nobody@x.in"}


# ---------- every data endpoint needs a sign-in ----------

PROTECTED = [("GET", "/api/session"), ("GET", "/api/privacy"), ("GET", "/api/dashboard"), ("GET", "/api/trends"),
             ("GET", "/api/money-flow"), ("GET", "/api/surplus-plan"), ("GET", "/api/goals"), ("POST", "/api/goals"),
             ("GET", "/api/statements"), ("POST", "/api/upload"), ("POST", "/api/demo-data"), ("GET", "/api/transactions"),
             ("GET", "/api/categories"), ("POST", "/api/transactions/1/category"), ("GET", "/api/recurring"),
             ("GET", "/api/flags"), ("POST", "/api/flags/large-1/decision"), ("POST", "/api/ask"), ("POST", "/api/what-if"),
             ("GET", "/api/forecast-log"), ("GET", "/api/forecast-log/verify"), ("POST", "/api/track-record/backtest"),
             ("GET", "/api/track-record"), ("GET", "/api/categorisation-accuracy"), ("GET", "/api/card"),
             ("POST", "/api/card/register/start"), ("POST", "/api/card/verify/start"), ("GET", "/api/card/requests/1"),
             ("POST", "/api/auth/verify-password"), ("POST", "/api/auth/logout"), ("POST", "/api/data/export"),
             ("DELETE", "/api/data")]


@pytest.mark.parametrize("method,url", PROTECTED)
def test_endpoint_needs_a_valid_sign_in(anon, method, url):
    for headers in ({}, {"Authorization": "Bearer sg_garbage"}, {"Authorization": "Token abc"}, {"Authorization": "Bearer"}):
        assert anon.request(method, url, headers=headers).status_code == 401, headers


# ---------- users are separated ----------

def test_one_user_never_sees_anothers_data(complete):
    other = signup(complete)
    assert complete.get("/api/transactions", headers=other).json()["total"] == 0
    assert complete.get("/api/statements", headers=other).json()["files"] == []
    assert complete.get("/api/flags", headers=other).json()["flags"] == []
    assert complete.get("/api/dashboard", headers=other).json()["insufficientHistory"] is True
    mine = complete.get("/api/transactions").json()["transactions"][0]["id"]
    groceries = complete.get("/api/categories").json()[0]["id"]
    assert complete.post(f"/api/transactions/{mine}/category", json={"categoryId": groceries}, headers=other).status_code == 404
    batch = complete.post(f"/api/transactions/{mine}/category", json={"categoryId": groceries}).json()["batchId"]
    assert complete.post(f"/api/corrections/{batch}/undo", headers=other).status_code == 404
    complete.post("/api/goals", json={"name": "Phone", "targetPaise": 8_000_000, "targetDate": "2026-12-31"})
    assert complete.get("/api/goals", headers=other).json()["goals"] == []


def test_two_users_can_upload_the_same_statement(complete):
    other = signup(complete)
    r = complete.post("/api/demo-data?set=eight_months_complete", headers=other)
    assert all(f["status"] == "imported" for f in r.json()["files"])      # "already uploaded" is per user, never global
    assert complete.get("/api/transactions", headers=other).json()["total"] == complete.get("/api/transactions").json()["total"]


# ---------- verify password ----------

def test_verify_password(client):
    assert client.post("/api/auth/verify-password", json={"password": "wrong wrong"}).status_code == 401
    assert client.post("/api/auth/verify-password", json={"password": PASSWORD}).json() == {"verified": True}


# ---------- card: register ----------

def test_register_stores_only_a_hash_of_the_uid(client, db_path):
    rid, device = register_card(client)
    assert device.status_code == 200 and device.json() == {"status": "registered", "last4": "4F2A"}
    assert client.get(f"/api/card/requests/{rid}").json() == {"status": "done", "errorCode": None, "last4": "4F2A"}
    assert client.get("/api/card").json()["registered"] is True and client.get("/api/card").json()["last4"] == "4F2A"
    stored = sqlite3.connect(db_path).execute("SELECT uid_hash FROM cards").fetchone()[0]
    assert stored == hashlib.sha256(f"{config.CARD_PEPPER}:04A2194F2A".encode()).hexdigest()
    assert "04A2194F2A" not in dump(db_path).upper() and "04:A2:19:4F:2A" not in dump(db_path)


def test_uid_spelling_does_not_matter(client):
    register_card(client, uid="04a2194f2a")
    assert verify_both(client, uid="04-A2-19-4F-2A").status_code == 200


def test_bad_uid_is_rejected(client):
    client.post("/api/card/register/start", json={})
    for uid in ("", "xyz", "04:A2", "0" * 30):
        assert client.post("/api/card/register", json={"uid": uid}, headers=DEVICE).status_code == 422


def test_one_card_per_account(with_card):
    r = with_card.post("/api/card/register/start", json={})
    assert r.status_code == 409 and r.json()["detail"]["code"] == "CARD_EXISTS"


def test_a_card_cannot_be_linked_to_two_accounts(with_card):
    other = signup(with_card)
    rid = with_card.post("/api/card/register/start", json={}, headers=other).json()["requestId"]
    r = with_card.post("/api/card/register", json={"uid": UID}, headers=DEVICE)
    assert r.status_code == 409 and r.json()["detail"]["code"] == "ALREADY_LINKED"
    assert with_card.get(f"/api/card/requests/{rid}", headers=other).json()["errorCode"] == "ALREADY_LINKED"
    assert with_card.get("/api/card", headers=other).json()["registered"] is False


def test_tap_with_nobody_waiting(client):
    r = client.post("/api/card/register", json={"uid": UID}, headers=DEVICE)
    assert r.status_code == 404 and r.json()["detail"]["code"] == "NO_PENDING_REQUEST"


def test_two_people_waiting_is_refused_not_guessed(client):
    client.post("/api/card/register/start", json={})
    signup_headers = signup(client)
    client.post("/api/card/register/start", json={}, headers=signup_headers)
    r = client.post("/api/card/register", json={"uid": UID}, headers=DEVICE)
    assert r.status_code == 409 and r.json()["detail"]["code"] == "AMBIGUOUS_REQUEST"


def test_a_new_request_cancels_the_old_one(client):
    first = client.post("/api/card/register/start", json={}).json()["requestId"]
    client.post("/api/card/register/start", json={})
    assert client.get(f"/api/card/requests/{first}").json() == {"status": "failed", "errorCode": "SUPERSEDED", "last4": None}


def test_request_times_out(client, clock):
    rid = client.post("/api/card/register/start", json={}).json()["requestId"]
    clock(config.CARD_REQUEST_SECONDS + 1)
    assert client.get(f"/api/card/requests/{rid}").json()["errorCode"] == "TIMEOUT"
    assert client.post("/api/card/register", json={"uid": UID}, headers=DEVICE).status_code == 404


def test_requests_are_private(client):
    rid = client.post("/api/card/register/start", json={}).json()["requestId"]
    assert client.get(f"/api/card/requests/{rid}", headers=signup(client)).status_code == 404


# ---------- the shared device secret ----------

@pytest.mark.parametrize("headers", [{}, {"X-Device-Secret": "wrong"}, {"X-Device-Secret": ""}])
def test_device_endpoints_need_the_secret(client, headers):
    client.post("/api/card/register/start", json={})
    assert client.post("/api/card/register", json={"uid": UID}, headers=headers).status_code == 401
    assert client.post("/api/card/verify", json={"uid": UID}, headers=headers).status_code == 401


def test_without_a_configured_secret_the_card_endpoints_are_off(client, monkeypatch):
    monkeypatch.setattr(config, "DEVICE_SECRET", None)
    assert client.post("/api/card/register", json={"uid": UID}, headers=DEVICE).status_code == 503
    assert client.post("/api/card/register", json={"uid": UID}, headers={"X-Device-Secret": ""}).status_code == 503


def test_the_device_secret_is_not_a_login_and_a_login_is_not_the_secret(anon):
    assert anon.get("/api/card", headers=DEVICE).status_code == 401
    headers = signup(anon)
    assert anon.post("/api/card/register", json={"uid": UID}, headers=headers).status_code == 401


# ---------- card: verify ----------

def test_verify_needs_a_registered_card(client):
    r = client.post("/api/card/verify/start")
    assert r.status_code == 409 and r.json()["detail"]["code"] == "NO_CARD"


def test_verify_right_card_and_wrong_card(with_card):
    rid = with_card.post("/api/card/verify/start").json()["requestId"]
    wrong = with_card.post("/api/card/verify", json={"uid": OTHER_UID}, headers=DEVICE)
    assert wrong.status_code == 403 and wrong.json()["detail"]["code"] == "MISMATCH"
    assert with_card.get(f"/api/card/requests/{rid}").json()["errorCode"] == "MISMATCH"
    rid = with_card.post("/api/card/verify/start").json()["requestId"]
    assert with_card.post("/api/card/verify", json={"uid": UID}, headers=DEVICE).json() == {"status": "verified", "last4": "4F2A"}
    assert with_card.get(f"/api/card/requests/{rid}").json()["status"] == "done"


# ---------- sensitive actions: password AND card, within 60 seconds ----------

def test_export_needs_both_steps(with_card):
    r = with_card.post("/api/data/export")
    assert r.status_code == 403 and r.json()["detail"]["code"] == "PASSWORD_NOT_VERIFIED"
    with_card.post("/api/auth/verify-password", json={"password": PASSWORD})
    r = with_card.post("/api/data/export")
    assert r.status_code == 403 and r.json()["detail"]["code"] == "CARD_NOT_VERIFIED"
    verify_both(with_card)
    assert with_card.post("/api/data/export").status_code == 200


def test_a_card_tap_alone_is_not_enough(with_card):
    with_card.post("/api/card/verify/start")
    with_card.post("/api/card/verify", json={"uid": UID}, headers=DEVICE)
    assert with_card.post("/api/data/export").json()["detail"]["code"] == "PASSWORD_NOT_VERIFIED"


def test_a_wrong_password_does_not_open_the_window(with_card):
    verify_both(with_card, password="not the password")
    assert with_card.post("/api/data/export").json()["detail"]["code"] == "PASSWORD_NOT_VERIFIED"


def test_the_window_is_sixty_seconds(with_card, clock):
    assert config.SENSITIVE_WINDOW_SECONDS == 60
    verify_both(with_card)
    clock(59)
    assert with_card.post("/api/data/export").status_code == 200
    verify_both(with_card)
    clock(61)
    assert with_card.post("/api/data/export").json()["detail"]["code"] == "PASSWORD_NOT_VERIFIED"


def test_each_step_expires_on_its_own(with_card, clock):
    with_card.post("/api/card/verify/start")
    with_card.post("/api/card/verify", json={"uid": UID}, headers=DEVICE)
    clock(40)
    with_card.post("/api/auth/verify-password", json={"password": PASSWORD})      # password fresh, card 40 s old
    assert with_card.post("/api/data/export").status_code == 200
    with_card.post("/api/card/verify/start")
    with_card.post("/api/card/verify", json={"uid": UID}, headers=DEVICE)
    clock(40)
    with_card.post("/api/auth/verify-password", json={"password": PASSWORD})
    clock(30)                                                                      # card now 70 s old, password 30 s
    assert with_card.post("/api/data/export").json()["detail"]["code"] == "CARD_NOT_VERIFIED"


def test_one_verification_pays_for_one_action(with_card):
    verify_both(with_card)
    assert with_card.post("/api/data/export").status_code == 200
    assert with_card.post("/api/data/export").status_code == 403


def test_a_failed_attempt_does_not_use_up_the_verification(with_card):
    verify_both(with_card)
    assert with_card.post("/api/data/export", headers={"Authorization": "Bearer sg_bad"}).status_code == 401
    assert with_card.post("/api/data/export").status_code == 200


def test_the_password_step_belongs_to_the_session(with_card):
    verify_both(with_card)
    other_session = with_card.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD}).json()["token"]
    r = with_card.post("/api/data/export", headers={"Authorization": f"Bearer {other_session}"})
    assert r.json()["detail"]["code"] == "PASSWORD_NOT_VERIFIED"


def test_someone_elses_verification_does_not_count(with_card):
    other = signup(with_card)
    register_card(with_card, uid=OTHER_UID, headers=other)
    verify_both(with_card, password="another long pass", uid=OTHER_UID, headers=other)
    assert with_card.post("/api/data/export", headers=other).status_code == 200
    assert with_card.post("/api/data/export").status_code == 403


# ---------- replacing the card ----------

def test_replacing_the_card_needs_password_and_current_card(with_card):
    r = with_card.post("/api/card/register/start", json={"replace": True})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "PASSWORD_NOT_VERIFIED"
    verify_both(with_card)
    rid = with_card.post("/api/card/register/start", json={"replace": True}).json()["requestId"]
    assert with_card.post("/api/card/register", json={"uid": OTHER_UID}, headers=DEVICE).json()["last4"] == "109C"
    assert with_card.get("/api/card").json()["last4"] == "109C"
    with_card.post("/api/card/verify/start")
    assert with_card.post("/api/card/verify", json={"uid": UID}, headers=DEVICE).status_code == 403          # old card is dead
    assert with_card.post("/api/card/register/start", json={"replace": True}).status_code == 403            # the verification was used up


# ---------- session / privacy facts ----------

def test_session_and_privacy_report_real_facts(complete, db_path):
    s = complete.get("/api/session").json()
    assert s["user"]["email"] == EMAIL and s["accounts"] == ["HDFC ••1234", "Kotak ••5678"] and s["accountCount"] == 2
    assert s["flagCount"] == complete.get("/api/flags").json()["openCount"] and s["lastSyncedAt"]
    p = complete.get("/api/privacy").json()
    assert p["card"] is None and p["rawFilesStored"] == 0 and p["maskedAccount"] == "HDFC ••1234"
    assert p["counts"]["transactions"] == complete.get("/api/transactions").json()["total"] and p["counts"]["files"] == 3
    assert "50100123451234" not in str(p) and "7312345678905678" not in dump(db_path)
    register_card(complete)
    assert complete.get("/api/privacy").json()["card"]["last4"] == "4F2A"


# ---------- export ----------

def test_export_contains_the_users_data_only(complete):
    other = signup(complete)
    register_card(complete)
    complete.post("/api/goals", json={"name": "Phone", "targetPaise": 8_000_000, "targetDate": "2026-12-31"})
    complete.post("/api/track-record/backtest")
    verify_both(complete)
    data = complete.post("/api/data/export").json()
    assert len(data["transactions"]) == complete.get("/api/transactions").json()["total"]
    assert data["goals"] == [{"name": "Phone", "targetPaise": 8_000_000, "savedPaise": 0, "targetDate": "2026-12-31"}]
    assert len(data["forecastLog"]) == 10
    row = next(t for t in data["transactions"] if "ORD-SIM98231" in t["description"])
    assert row["amountPaise"] == -149_900 and row["bank"] == "Kotak" and row["category"] == "Groceries"
    assert "password" not in str(data).lower() and "sg_" not in str(data)
    verify_both(complete, password="another long pass", uid=UID, headers=other)      # the other user has no card: nothing to export
    assert complete.post("/api/data/export", headers=other).status_code == 403


# ---------- delete ----------

def user_tables(db):
    """Tables that carry a user_id column."""
    names = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")]
    return [n for n in names if "user_id" in [c[1] for c in db.execute(f"PRAGMA table_info({n})")]]


def test_delete_needs_both_steps_and_leaves_data_alone_without_them(with_card):
    with_card.post("/api/demo-data?set=eight_months_complete")
    assert with_card.delete("/api/data").status_code == 403
    with_card.post("/api/auth/verify-password", json={"password": PASSWORD})
    assert with_card.delete("/api/data").status_code == 403
    assert with_card.get("/api/transactions").json()["total"] > 0


def test_delete_wipes_everything_of_this_user_and_nothing_of_anyone_else(complete, db_path):
    other = signup(complete, "keeper@example.com")
    complete.post("/api/demo-data?set=short_2mo", headers=other)
    keeper_rows = complete.get("/api/transactions", headers=other).json()["total"]
    # give the first user data in every table that can hold some
    register_card(complete)
    first = complete.get("/api/transactions", params={"q": "ZOMATO"}).json()["transactions"][0]["id"]
    complete.post(f"/api/transactions/{first}/category", json={"categoryId": 1})
    flag = complete.get("/api/flags").json()["flags"][0]["id"]
    complete.post(f"/api/flags/{flag}/decision", json={"decision": "dismissed"})
    complete.post("/api/goals", json={"name": "Phone", "targetPaise": 8_000_000, "targetDate": "2026-12-31"})
    complete.post("/api/track-record/backtest")
    db = sqlite3.connect(db_path)
    uid = db.execute("SELECT id FROM users WHERE email = ?", (EMAIL,)).fetchone()[0]
    filled = {t: db.execute(f"SELECT COUNT(*) FROM {t} WHERE user_id = ?", (uid,)).fetchone()[0] for t in user_tables(db)}
    assert all(filled[t] > 0 for t in ("accounts", "goals", "recurring", "forecast_log", "cards", "sessions"))
    assert db.execute("SELECT COUNT(*) FROM corrections").fetchone()[0] > 0 and db.execute("SELECT COUNT(*) FROM flag_decisions").fetchone()[0] > 0

    verify_both(complete)
    assert complete.delete("/api/data").json() == {"deleted": True}

    db = sqlite3.connect(db_path)
    assert db.execute("SELECT COUNT(*) FROM users WHERE id = ?", (uid,)).fetchone()[0] == 0
    for table in user_tables(db):
        assert db.execute(f"SELECT COUNT(*) FROM {table} WHERE user_id = ?", (uid,)).fetchone()[0] == 0, table
    for table, owner in [("transactions", "account_id"), ("uploaded_files", "account_id")]:
        assert db.execute(f"SELECT COUNT(*) FROM {table} WHERE {owner} NOT IN (SELECT id FROM accounts)").fetchone()[0] == 0
    for table in ("corrections", "flag_decisions"):
        assert db.execute(f"SELECT COUNT(*) FROM {table} WHERE transaction_id NOT IN (SELECT id FROM transactions)").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM transactions").fetchone()[0] == keeper_rows        # only the keeper's rows remain
    assert db.execute("SELECT COUNT(*) FROM categories").fetchone()[0] > 10                     # shared reference data stays
    assert complete.get("/api/transactions", headers=other).json()["total"] == keeper_rows
    assert complete.get("/api/forecast-log/verify", headers=other).json()["valid"] is True


def test_after_delete_the_user_cannot_sign_in_and_the_old_token_is_dead(with_card):
    verify_both(with_card)
    with_card.delete("/api/data")
    assert with_card.get("/api/session").status_code == 401
    assert with_card.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD}).status_code == 401


def test_deleted_text_is_overwritten_in_the_database_file(complete, db_path):
    register_card(complete)
    assert b"ORD-SIM98231" in db_path.read_bytes() and EMAIL.encode() in db_path.read_bytes()
    verify_both(complete)
    complete.delete("/api/data")
    raw = db_path.read_bytes()
    for text in (b"ORD-SIM98231", EMAIL.encode(), b"Tester", b"UPI/ZOMATO", b"MR SHARMA LANDLORD", b"HDFC"):
        assert text not in raw, text          # (the keyword rules like SWIGGY are shared reference data and stay)
