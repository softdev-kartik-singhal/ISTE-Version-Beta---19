"""The NFC card: tap requests from the browser, callbacks from the ESP32, and the sensitive-action window.

How a tap works: the signed-in browser opens a 'register' or 'verify' REQUEST. The ESP32 then posts the card
UID; the server matches it to the one pending request of that kind. The ESP32 never learns who the user is,
and the browser never touches the UID.
"""
import hmac
import sqlite3

from app import config, security


class CardError(Exception):
    """An HTTP status, a machine code the frontend understands, and a message."""

    def __init__(self, status, code, reason):
        super().__init__(reason)
        self.status, self.code, self.reason = status, code, reason


# ---------- the user's card ----------

def card_of(conn, user_id):
    return conn.execute("SELECT uid_hash, last4, created_at FROM cards WHERE user_id = ?", (user_id,)).fetchone()


# ---------- tap requests (browser side) ----------

def expire_old(conn):
    """A request nobody tapped for within CARD_REQUEST_SECONDS has timed out."""
    t = security.now()
    conn.execute("UPDATE card_requests SET status = 'failed', error_code = 'TIMEOUT', completed_at = ?"
                 " WHERE status = 'pending' AND created_at < ?", (t, t - config.CARD_REQUEST_SECONDS))


def start_request(conn, user_id, kind, replace=False):
    """Open a request and return its id. One open request per user and kind: a new one cancels the old."""
    expire_old(conn)
    card = card_of(conn, user_id)
    if kind == "register" and card and not replace:
        raise CardError(409, "CARD_EXISTS", "This account already has a card. Replacing it needs your password and the current card.")
    if kind == "verify" and not card:
        raise CardError(409, "NO_CARD", "No card is registered on this account.")
    conn.execute("UPDATE card_requests SET status = 'failed', error_code = 'SUPERSEDED', completed_at = ?"
                 " WHERE user_id = ? AND kind = ? AND status = 'pending'", (security.now(), user_id, kind))
    cur = conn.execute("INSERT INTO card_requests (user_id, kind, replace_card, created_at) VALUES (?, ?, ?, ?)",
                       (user_id, kind, int(replace), security.now()))
    conn.commit()
    return cur.lastrowid


def request_status(conn, user_id, request_id):
    """pending / done / failed (+ code) for one of the caller's requests; None if it is not theirs."""
    expire_old(conn)
    conn.commit()
    row = conn.execute("SELECT status, error_code, last4 FROM card_requests WHERE id = ? AND user_id = ?",
                       (request_id, user_id)).fetchone()
    if row is None:
        return None
    status = "done" if row["status"] in ("done", "used") else row["status"]
    return {"status": status, "errorCode": row["error_code"], "last4": row["last4"]}


# ---------- tap results (ESP32 side) ----------

def pending_request(conn, kind):
    """The single open request of this kind. Two users waiting at once would be ambiguous, so refuse."""
    expire_old(conn)
    rows = conn.execute("SELECT id, user_id, replace_card FROM card_requests WHERE kind = ? AND status = 'pending'", (kind,)).fetchall()
    if not rows:
        raise CardError(404, "NO_PENDING_REQUEST", "Nobody is waiting for a card tap.")
    if len(rows) > 1:
        raise CardError(409, "AMBIGUOUS_REQUEST", "More than one person is waiting; try again in a moment.")
    return rows[0]


def finish(conn, request_id, status, error_code=None, last4=None):
    conn.execute("UPDATE card_requests SET status = ?, error_code = ?, last4 = ?, completed_at = ? WHERE id = ?",
                 (status, error_code, last4, security.now(), request_id))


def device_register(conn, uid):
    """Bind the tapped card to whoever is waiting to register one."""
    digest, last4 = security.hash_uid(uid), security.uid_last4(uid)
    req = pending_request(conn, "register")
    owner = conn.execute("SELECT user_id FROM cards WHERE uid_hash = ?", (digest,)).fetchone()
    if owner and owner["user_id"] != req["user_id"]:
        finish(conn, req["id"], "failed", "ALREADY_LINKED")
        conn.commit()
        raise CardError(409, "ALREADY_LINKED", "This card is already registered to another account.")
    if req["replace_card"]:
        conn.execute("DELETE FROM cards WHERE user_id = ?", (req["user_id"],))
    try:
        conn.execute("INSERT INTO cards (user_id, uid_hash, last4) VALUES (?, ?, ?)", (req["user_id"], digest, last4))
    except sqlite3.IntegrityError:  # the account got a card in the meantime (one card per account)
        conn.rollback()
        raise CardError(409, "CARD_EXISTS", "This account already has a card.")
    finish(conn, req["id"], "done", last4=last4)
    conn.commit()
    return {"status": "registered", "last4": last4}


def device_verify(conn, uid):
    """Check the tapped card against the card of whoever is waiting to verify."""
    digest = security.hash_uid(uid)
    req = pending_request(conn, "verify")
    card = card_of(conn, req["user_id"])
    if card is None or not hmac.compare_digest(card["uid_hash"], digest):
        finish(conn, req["id"], "failed", "MISMATCH")
        conn.commit()
        raise CardError(403, "MISMATCH", "The tapped card is not the registered one.")
    finish(conn, req["id"], "done", last4=card["last4"])
    conn.commit()
    return {"status": "verified", "last4": card["last4"]}


def device_tap(conn, uid):
    """A plain tap from a reader that does not know what the browser is waiting for (the USB bridge).
    Whichever kind of request is open gets the tap; both open at once would be ambiguous, so refuse."""
    expire_old(conn)
    kinds = [r["kind"] for r in conn.execute("SELECT DISTINCT kind FROM card_requests WHERE status = 'pending'")]
    if not kinds:
        raise CardError(404, "NO_PENDING_REQUEST", "Nobody is waiting for a card tap.")
    if len(kinds) > 1:
        raise CardError(409, "AMBIGUOUS_REQUEST", "More than one person is waiting; try again in a moment.")
    return device_register(conn, uid) if kinds[0] == "register" else device_verify(conn, uid)


# ---------- sensitive actions: password AND card, both recent ----------

def check_fresh(conn, session):
    """Raises CardError(403) unless the password and a card tap were both verified within the window."""
    t, window = security.now(), config.SENSITIVE_WINDOW_SECONDS
    stamp = session["password_verified_at"]
    if stamp is None or t - stamp > window:
        raise CardError(403, "PASSWORD_NOT_VERIFIED", f"Confirm your password first (valid for {window} seconds).")
    tap = conn.execute("SELECT completed_at FROM card_requests WHERE user_id = ? AND kind = 'verify' AND status = 'done'"
                       " ORDER BY completed_at DESC LIMIT 1", (session["user_id"],)).fetchone()
    if tap is None or t - tap["completed_at"] > window:
        raise CardError(403, "CARD_NOT_VERIFIED", f"Tap your card first (valid for {window} seconds).")


def consume_fresh(conn, session):
    """Each verification pays for ONE action: the next export, delete or card swap needs a new password check and tap."""
    conn.execute("UPDATE sessions SET password_verified_at = NULL WHERE token_hash = ?", (session["token_hash"],))
    conn.execute("UPDATE card_requests SET status = 'used' WHERE user_id = ? AND kind = 'verify' AND status = 'done'",
                 (session["user_id"],))
