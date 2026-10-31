"""FastAPI dependencies: who is calling, and has the caller just proved password + card?"""
from fastapi import Depends, Header, HTTPException

from app import config, security
from app.db import get_conn
from app.services.auth import session_for_token


def current_session(authorization: str | None = Header(None), conn=Depends(get_conn)):
    """The caller's live session, from 'Authorization: Bearer <token>'. 401 otherwise."""
    scheme, _, token = (authorization or "").partition(" ")
    session = session_for_token(conn, token.strip()) if scheme.lower() == "bearer" and token.strip() else None
    if session is None:
        raise HTTPException(401, {"reason": "Sign in required."}, headers={"WWW-Authenticate": "Bearer"})
    return session


def current_user_id(session=Depends(current_session)):
    return session["user_id"]


def require_device(x_device_secret: str | None = Header(None)):
    """Guards the endpoints the ESP32 calls. 503 if no secret is configured, 401 if it is wrong."""
    if not config.DEVICE_SECRET:
        raise HTTPException(503, {"reason": "Card reader access is not configured on the server."})
    if not security.device_secret_ok(x_device_secret):
        raise HTTPException(401, {"reason": "Bad device secret."})
