"""Passwords, session tokens and card-UID hashing. Nothing secret is ever stored in the clear."""
import hashlib
import hmac
import re
import secrets
import time

import bcrypt

from app import config


def now():
    """Current unix time in seconds. A function so tests can move the clock."""
    return int(time.time())


# ---------- passwords (bcrypt) ----------

def password_problem(password):
    """Why this password is not acceptable, or None. bcrypt only reads the first 72 bytes, so longer is refused."""
    if len(password) < config.PASSWORD_MIN_LENGTH:
        return f"Password must be at least {config.PASSWORD_MIN_LENGTH} characters."
    if len(password.encode()) > 72:
        return "Password must be at most 72 bytes."
    return None


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(config.BCRYPT_ROUNDS)).decode()


def check_password(password, hashed):
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:  # malformed hash, or a password bcrypt cannot take
        return False


# ---------- session tokens ----------

def new_token():
    return "sg_" + secrets.token_urlsafe(32)


def token_hash(token):
    """Sessions are looked up by this hash, so a leaked database does not leak live tokens."""
    return hashlib.sha256(token.encode()).hexdigest()


# ---------- card UID ----------

def normalise_uid(uid):
    """'04:a2:19:4f:2a' -> '04A2194F2A'. Raises ValueError unless it is 4-10 bytes of hex."""
    cleaned = re.sub(r"[\s:\-]", "", uid or "").upper()
    if not re.fullmatch(r"[0-9A-F]{8,20}", cleaned):
        raise ValueError("Card UID must be 4 to 10 bytes of hexadecimal.")
    return cleaned


def hash_uid(uid):
    """SHA-256 of the UID with a server-side pepper. The UID itself is never stored."""
    return hashlib.sha256(f"{config.CARD_PEPPER}:{normalise_uid(uid)}".encode()).hexdigest()


def uid_last4(uid):
    return normalise_uid(uid)[-4:]


def device_secret_ok(provided):
    """Constant-time check of the ESP32's shared secret. False if no secret is configured."""
    return bool(config.DEVICE_SECRET) and hmac.compare_digest(provided or "", config.DEVICE_SECRET)
