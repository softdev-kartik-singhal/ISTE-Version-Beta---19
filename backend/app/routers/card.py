"""Card endpoints. Browser side needs a session; ESP32 side needs the shared device secret."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import get_conn
from app.deps import current_session, current_user_id, require_device
from app.security import normalise_uid
from app.services import card

router = APIRouter(prefix="/api/card")


class StartRegisterIn(BaseModel):
    replace: bool = False  # True = swap the existing card (needs a fresh password check and card tap)


class UidIn(BaseModel):
    uid: str


# ---------- browser ----------

@router.get("")
def my_card(user_id: int = Depends(current_user_id), conn=Depends(get_conn)):
    row = card.card_of(conn, user_id)
    return {"registered": row is not None, "last4": row["last4"] if row else None,
            "addedAt": row["created_at"] if row else None}


@router.post("/register/start")
def start_register(body: StartRegisterIn = StartRegisterIn(), session=Depends(current_session), conn=Depends(get_conn)):
    if body.replace and card.card_of(conn, session["user_id"]):
        card.check_fresh(conn, session)
        card.consume_fresh(conn, session)
    return {"requestId": card.start_request(conn, session["user_id"], "register", body.replace)}


@router.post("/verify/start")
def start_verify(user_id: int = Depends(current_user_id), conn=Depends(get_conn)):
    return {"requestId": card.start_request(conn, user_id, "verify")}


@router.get("/requests/{request_id}")
def request_status(request_id: int, user_id: int = Depends(current_user_id), conn=Depends(get_conn)):
    status = card.request_status(conn, user_id, request_id)
    if status is None:
        raise HTTPException(404, {"reason": "Unknown request."})
    return status


# ---------- ESP32 ----------

def valid_uid(uid):
    """422 unless the UID looks like card hex; returns it untouched."""
    try:
        normalise_uid(uid)
    except ValueError as e:
        raise HTTPException(422, {"reason": str(e)})
    return uid


@router.post("/register", dependencies=[Depends(require_device)])
def device_register(body: UidIn, conn=Depends(get_conn)):
    return card.device_register(conn, valid_uid(body.uid))


@router.post("/verify", dependencies=[Depends(require_device)])
def device_verify(body: UidIn, conn=Depends(get_conn)):
    return card.device_verify(conn, valid_uid(body.uid))


@router.post("/tap", dependencies=[Depends(require_device)])
def device_tap(body: UidIn, conn=Depends(get_conn)):
    """For readers that just report taps (the USB bridge): answers whichever request is open."""
    return card.device_tap(conn, valid_uid(body.uid))
