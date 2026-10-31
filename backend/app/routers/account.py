"""Auth, session, privacy, export and delete."""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from fastapi import HTTPException

from app import config
from app.db import get_conn
from app.deps import current_session, current_user_id
from app.services import auth
from app.services.account import delete_everything, privacy_payload, save_tour, session_payload
from app.services.report import build_report
from app.services.card import check_fresh, consume_fresh

router = APIRouter(prefix="/api")


class SignupIn(BaseModel):
    name: str
    email: str
    password: str
    profile: str | None = None


class LoginIn(BaseModel):
    email: str
    password: str


class ResetIn(BaseModel):
    email: str


class PasswordIn(BaseModel):
    password: str


@router.post("/auth/signup", status_code=201)
def signup(body: SignupIn, conn=Depends(get_conn)):
    return auth.signup(conn, body.name, body.email, body.password, body.profile)


@router.post("/auth/login")
def login(body: LoginIn, conn=Depends(get_conn)):
    return auth.login(conn, body.email, body.password)


@router.post("/auth/demo")
def demo_login(conn=Depends(get_conn)):
    """One-click demo: signs in as the demo user (created and filled with the demo dataset if needed)."""
    from app.services.demo import ensure_demo_user
    ensure_demo_user(conn)
    return auth.login(conn, config.DEMO_EMAIL, config.DEMO_PASSWORD)


@router.post("/auth/logout")
def logout(session=Depends(current_session), conn=Depends(get_conn)):
    conn.execute("DELETE FROM sessions WHERE token_hash = ?", (session["token_hash"],))
    conn.commit()
    return {"signedOut": True}


@router.post("/auth/reset")
def request_reset(body: ResetIn):
    """No email is sent yet (there is no mail service). The same answer for every address, so it does not
    reveal which emails have accounts."""
    return {"sentTo": body.email}


@router.post("/auth/verify-password")
def verify_password(body: PasswordIn, session=Depends(current_session), conn=Depends(get_conn)):
    """Step 1 of a sensitive action. Valid for SENSITIVE_WINDOW_SECONDS."""
    return {"verified": auth.verify_password(conn, session, body.password)}


@router.get("/session")
def get_session(account: int | None = Query(None), user_id: int = Depends(current_user_id), conn=Depends(get_conn)):
    """account (optional) only narrows the flag count; an unknown account is ignored so the account list always loads."""
    return session_payload(conn, user_id, account)


class TourIn(BaseModel):
    completed: bool = False
    step: int = Field(0, ge=0, le=50)


@router.put("/tour")
def put_tour(body: TourIn, user_id: int = Depends(current_user_id), conn=Depends(get_conn)):
    """Save tour progress. completed=true also covers 'skipped'; completed=false with step=0 replays it."""
    return save_tour(conn, user_id, body.completed, body.step)


@router.get("/privacy")
def get_privacy(user_id: int = Depends(current_user_id), conn=Depends(get_conn)):
    return privacy_payload(conn, user_id)


@router.post("/data/export")
def export(session=Depends(current_session), conn=Depends(get_conn)):
    """The full analysis report (HTML). Needs a password check AND a card tap, each within the last 60 seconds. Uses them up."""
    check_fresh(conn, session)
    data = build_report(conn, session["user_id"])
    consume_fresh(conn, session)
    conn.commit()
    return data


@router.delete("/data")
def delete_data(session=Depends(current_session), conn=Depends(get_conn)):
    """Same checks as export. Removes the account and everything attached to it."""
    if conn.execute("SELECT email FROM users WHERE id = ?", (session["user_id"],)).fetchone()["email"] == config.DEMO_EMAIL:
        raise HTTPException(403, {"reason": "The shared demo account cannot be deleted."})
    check_fresh(conn, session)
    delete_everything(conn, session["user_id"])
    return {"deleted": True}
