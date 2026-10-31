"""Dashboard, trends, money flow and surplus plan."""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import MONEY_FLOW_TOP_N, SURPLUS_DEFAULT_SPLIT
from app.db import get_conn
from app.services.forecast import build_inputs
from app.deps import account_filter, current_user_id
from app.services.insights import dashboard, load_ledger, trends
from app.services.moneyflow import money_flow
from app.services.money_uses import ways_to_use_money
from app.services.surplus_plan import surplus_plan
from app.services.survival import survival

router = APIRouter(prefix="/api")


def context(conn, user_id, account_id=None):
    """(ledger, inputs) for the current user (or one of their accounts): everything the insight functions need."""
    return load_ledger(conn, user_id, account_id), build_inputs(conn, user_id, account_id=account_id)


@router.get("/dashboard")
def get_dashboard(conn=Depends(get_conn), user_id: int = Depends(current_user_id), account_id=Depends(account_filter)):
    return dashboard(*context(conn, user_id, account_id))


@router.get("/trends")
def get_trends(conn=Depends(get_conn), user_id: int = Depends(current_user_id), account_id=Depends(account_filter)):
    ledger, inp = context(conn, user_id, account_id)
    return trends(ledger, inp)


@router.get("/money-flow")
def get_money_flow(month: str | None = None, compare: str = Query("median", pattern="^(prev|median)$"),
                   top_n: int = Query(MONEY_FLOW_TOP_N, ge=1, le=20), category: str | None = None,
                   conn=Depends(get_conn), user_id: int = Depends(current_user_id), account_id=Depends(account_filter)):
    ledger, inp = context(conn, user_id, account_id)
    try:
        return money_flow(ledger, inp, month, compare, top_n, category)
    except ValueError as e:
        raise HTTPException(422, {"reason": str(e)})


@router.get("/survival")
def get_survival(conn=Depends(get_conn), user_id: int = Depends(current_user_id), account_id=Depends(account_filter)):
    """If income stopped: months the cash would last, and what stopping each non-essential expense would add."""
    return survival(*context(conn, user_id, account_id))


@router.get("/ways-to-use-money")
def get_ways_to_use_money(fd_rate: float | None = Query(None, ge=0, le=15), rd_rate: float | None = Query(None, ge=0, le=15),
                          conn=Depends(get_conn), user_id: int = Depends(current_user_id), account_id=Depends(account_filter)):
    """What a fixed deposit, a recurring deposit and insurance could do for this user's numbers (rates are examples)."""
    return ways_to_use_money(*context(conn, user_id, account_id), fd_rate, rd_rate)


@router.get("/surplus-plan")
def get_surplus_plan(split: int = Query(SURPLUS_DEFAULT_SPLIT, ge=0, le=100), conn=Depends(get_conn), user_id: int = Depends(current_user_id),
                     account_id=Depends(account_filter)):
    return surplus_plan(*context(conn, user_id, account_id), split)
