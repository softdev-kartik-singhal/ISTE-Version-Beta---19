"""Recurring payments and anomaly flags."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import get_conn
from app.services.flags import decide, flags_payload, undo_decision
from app.deps import current_user_id

router = APIRouter(prefix="/api")


class DecisionIn(BaseModel):
    decision: str  # 'confirmed' or 'dismissed'


@router.get("/recurring")
def list_recurring(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    rows = conn.execute("SELECT * FROM recurring WHERE user_id = ? ORDER BY next_expected",
                        (user_id,)).fetchall()
    items = [{"merchant": r["merchant"], "label": r["label"], "typicalPaise": r["typical_paise"],
              "cadenceDays": r["cadence_days"], "occurrences": r["occurrences"], "lastSeen": r["last_seen"],
              "nextExpected": r["next_expected"]} for r in rows]
    return {"items": items}


@router.get("/flags")
def list_flags(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return flags_payload(conn, user_id)


@router.post("/flags/{flag_id}/decision")
def decide_flag(flag_id: str, body: DecisionIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    result = decide(conn, user_id, flag_id, body.decision)
    if result is None:
        raise HTTPException(404, {"reason": "Unknown flag, or decision is not 'confirmed'/'dismissed'."})
    conn.commit()
    return result


@router.delete("/flags/{flag_id}/decision")
def undo_flag_decision(flag_id: str, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    if not undo_decision(conn, user_id, flag_id):
        raise HTTPException(404, {"reason": "No decision recorded for that flag."})
    conn.commit()
    return {"id": flag_id, "decision": None}
