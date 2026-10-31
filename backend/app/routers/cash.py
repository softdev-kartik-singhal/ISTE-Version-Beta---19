"""Cash wallet: manual cash income and spending, and splitting ATM withdrawals."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db import get_conn
from app.deps import current_user_id
from app.services import cash

router = APIRouter(prefix="/api")


class CashIn(BaseModel):
    type: Literal["spent", "received"]
    amountPaise: int = Field(gt=0)
    category: str | None = None      # spent: a spending category name
    sourceType: str | None = None    # received: gift / salary in cash / freelance / other
    date: str | None = None          # YYYY-MM-DD, default today
    note: str | None = Field(None, max_length=200)


class CashChange(BaseModel):
    amountPaise: int | None = Field(None, gt=0)
    category: str | None = None
    sourceType: str | None = None
    date: str | None = None
    note: str | None = Field(None, max_length=200)


class Part(BaseModel):
    amountPaise: int = Field(gt=0)
    category: str


class SplitIn(BaseModel):
    withdrawalId: int
    parts: list[Part]


def guarded(call, *args, **kwargs):
    """Run a cash.py call and turn its CashError into an HTTP error with a plain reason."""
    try:
        return call(*args, **kwargs)
    except cash.CashError as err:
        raise HTTPException(err.status, {"reason": err.reason}) from err


@router.get("/cash")
def get_cash(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return cash.cash_payload(conn, user_id)


@router.post("/cash", status_code=201)
def add_cash(body: CashIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    entry_id, duplicate = guarded(cash.add_entry, conn, user_id, body.type, body.amountPaise, body.category, body.sourceType, body.date, body.note)
    payload = cash.cash_payload(conn, user_id)
    entry = next(e for e in payload["entries"] if e["id"] == entry_id)
    return {"entry": entry, "duplicateWarning": duplicate, "wallet": payload["wallet"]}


@router.patch("/cash/{entry_id}")
def change_cash(entry_id: int, body: CashChange, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    guarded(cash.update_entry, conn, user_id, entry_id, body.model_dump(exclude_unset=True, exclude_none=True) | ({"note": body.note} if "note" in body.model_fields_set else {}))
    return cash.cash_payload(conn, user_id)


@router.delete("/cash/{entry_id}")
def delete_cash(entry_id: int, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    guarded(cash.delete_entry, conn, user_id, entry_id)
    return cash.cash_payload(conn, user_id)


@router.post("/cash/split-withdrawal", status_code=201)
def split_withdrawal(body: SplitIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    guarded(cash.split_withdrawal, conn, user_id, body.withdrawalId, [p.model_dump() for p in body.parts])
    return cash.cash_payload(conn, user_id)
