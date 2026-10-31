"""Signup, login, sessions and the 'password just verified' stamp."""
import re
import sqlite3

from app import config, security
from app.security import token_hash

EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
FAILED_LOGINS = {}  # email -> [timestamps of recent wrong passwords]; in memory, so a restart clears it


class AuthError(Exception):
    """Carries an HTTP status and a message for the user."""

    def __init__(self, status, reason):
        super().__init__(reason)
        self.status, self.reason = status, reason


def create_session(conn, user_id):
    """Start a session; returns the token (shown once, only its hash is stored)."""
    token, t = security.new_token(), security.now()
    conn.execute("DELETE FROM sessions WHERE expires_at < ?", (t,))  # tidy up old ones
    conn.execute("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                 (token_hash(token), user_id, t, t + config.SESSION_HOURS * 3600))
    return token


def signup(conn, name, email, password, profile=None):
    name, email = (name or "").strip(), (email or "").strip().lower()
    if not name:
        raise AuthError(422, "Name is required.")
    if not EMAIL.fullmatch(email):
        raise AuthError(422, "Enter a valid email address.")
    problem = security.password_problem(password or "")
    if problem:
        raise AuthError(422, problem)
    try:
        cur = conn.execute("INSERT INTO users (name, email, password_hash, profile) VALUES (?, ?, ?, ?)",
                           (name, email, security.hash_password(password), profile))
    except sqlite3.IntegrityError:
        raise AuthError(409, "An account with this email already exists.")
    token = create_session(conn, cur.lastrowid)
    conn.commit()
    return {"token": token, "user": {"id": cur.lastrowid, "name": name, "email": email}}


def locked(email):
    """True if this email had too many wrong passwords recently."""
    recent = [t for t in FAILED_LOGINS.get(email, []) if security.now() - t < config.LOGIN_LOCK_SECONDS]
    FAILED_LOGINS[email] = recent
    return len(recent) >= config.LOGIN_MAX_FAILURES


def login(conn, email, password):
    email = (email or "").strip().lower()
    if locked(email):
        raise AuthError(429, "Too many wrong passwords. Try again in a few minutes.")
    user = conn.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (email,)).fetchone()
    # Always run one bcrypt check, so a wrong email takes as long as a wrong password.
    ok = security.check_password(password or "", user["password_hash"] if user else security.hash_password("x"))
    if not (user and ok):
        FAILED_LOGINS.setdefault(email, []).append(security.now())
        raise AuthError(401, "Email or master password is incorrect.")
    FAILED_LOGINS.pop(email, None)
    if email == config.DEMO_EMAIL:
        from app.services.demo import ensure_demo_data  # local import: demo.py imports this module
        ensure_demo_data(conn, user["id"])
    token = create_session(conn, user["id"])
    conn.commit()
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}


def session_for_token(conn, token):
    """The live session row for a token, or None (unknown or expired)."""
    row = conn.execute("SELECT token_hash, user_id, password_verified_at, expires_at FROM sessions WHERE token_hash = ?",
                       (token_hash(token),)).fetchone()
    return row if row and row["expires_at"] > security.now() else None


def logout(conn, token):
    conn.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash(token),))
    conn.commit()


def verify_password(conn, session, password):
    """Check the password again and stamp the session, starting the sensitive-action window."""
    user = conn.execute("SELECT password_hash FROM users WHERE id = ?", (session["user_id"],)).fetchone()
    if not security.check_password(password or "", user["password_hash"]):
        raise AuthError(401, "Incorrect master password.")
    conn.execute("UPDATE sessions SET password_verified_at = ? WHERE token_hash = ?",
                 (security.now(), session["token_hash"]))
    conn.commit()
    return True
