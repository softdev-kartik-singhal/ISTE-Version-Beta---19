"""POST /api/ask and POST /api/what-if."""
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import get_conn
from app.services.affordability import apply_changes, evaluate, what_if
from app.services.forecast import build_inputs, missing_items
from app.deps import current_user_id
from app.services.question import parse_question

router = APIRouter(prefix="/api")
MONTH_FORMAT = re.compile(r"\d{4}-(0[1-9]|1[0-2])")


class AskIn(BaseModel):
    question: str = ""
    amountPaise: int | None = None   # send both of these (after the user confirms) to get the answer
    targetMonth: str | None = None   # 'YYYY-MM'


class EmiIn(BaseModel):
    name: str = "New EMI"
    amountPaise: int
    startMonth: str | None = None    # 'YYYY-MM'; default = from the first forecast month


class WhatIfIn(BaseModel):
    amountPaise: int
    targetMonth: str
    cancelRecurring: list[str] = []
    addEmi: EmiIn | None = None


def checked_inputs(conn, user_id, amount, month):
    """Validate the request and load the inputs. Returns (inputs, refusal-or-None)."""
    if amount is None or amount <= 0:
        raise HTTPException(422, {"reason": "amountPaise must be a positive number."})
    if not month or not MONTH_FORMAT.fullmatch(month):
        raise HTTPException(422, {"reason": "targetMonth must look like 2026-12."})
    inp = build_inputs(conn, user_id)
    missing = missing_items(inp)
    return inp, ({"status": "insufficient_data", "missing": missing} if missing else None)


@router.post("/ask")
def ask(body: AskIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """Two steps. Question only -> what we understood (the user confirms). Amount + month -> the answer."""
    if body.amountPaise is None or body.targetMonth is None:
        parsed = parse_question(body.question, build_inputs(conn, user_id).as_of)
        return {"status": "needs_input" if parsed["missing"] else "needs_confirmation", "parsed": parsed}
    inp, refusal = checked_inputs(conn, user_id, body.amountPaise, body.targetMonth)
    if refusal:
        return refusal
    try:
        return {"status": "answered", "income": inp.profile, **evaluate(inp, body.amountPaise, body.targetMonth)}
    except ValueError as e:
        raise HTTPException(422, {"reason": str(e)})


@router.post("/what-if")
def what_if_endpoint(body: WhatIfIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """Same calculation on modified inputs: cancel recurring payments and/or add an EMI."""
    inp, refusal = checked_inputs(conn, user_id, body.amountPaise, body.targetMonth)
    if refusal:
        return refusal
    emi = body.addEmi.model_dump() if body.addEmi else None
    if emi and emi["amountPaise"] <= 0:
        raise HTTPException(422, {"reason": "EMI amount must be positive."})
    try:
        apply_changes(inp, body.cancelRecurring, emi)  # fail early with a clear message on unknown names
        return {"status": "answered", **what_if(inp, body.amountPaise, body.targetMonth, body.cancelRecurring, emi)}
    except KeyError as e:
        known = sorted(r["merchant"] for r in inp.recurring)
        raise HTTPException(422, {"reason": f"Not a recurring payment: {e.args[0]}.", "known": known})
    except ValueError as e:
        raise HTTPException(422, {"reason": str(e)})
