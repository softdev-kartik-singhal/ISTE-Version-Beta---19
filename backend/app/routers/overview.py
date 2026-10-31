"""Dashboard, trends, money flow and surplus plan."""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import MONEY_FLOW_TOP_N, SURPLUS_DEFAULT_SPLIT
from app.db import get_conn
from app.services.forecast import build_inputs
from app.services.ingest import default_user_id
from app.services.insights import dashboard, load_ledger, trends
from app.services.moneyflow import money_flow
from app.services.surplus_plan import surplus_plan

router = APIRouter(prefix="/api")


def context(conn):
    """(ledger, inputs) for the current user: everything the insight functions need."""
    user_id = default_user_id(conn)
    return load_ledger(conn, user_id), build_inputs(conn, user_id)


@router.get("/dashboard")
def get_dashboard(conn=Depends(get_conn)):
    return dashboard(*context(conn))


@router.get("/trends")
def get_trends(conn=Depends(get_conn)):
    ledger, inp = context(conn)
    return trends(ledger, inp)


@router.get("/money-flow")
def get_money_flow(month: str | None = None, compare: str = Query("median", pattern="^(prev|median)$"),
                   top_n: int = Query(MONEY_FLOW_TOP_N, ge=1, le=20), category: str | None = None,
                   conn=Depends(get_conn)):
    ledger, inp = context(conn)
    try:
        return money_flow(ledger, inp, month, compare, top_n, category)
    except ValueError as e:
        raise HTTPException(422, {"reason": str(e)})


@router.get("/surplus-plan")
def get_surplus_plan(split: int = Query(SURPLUS_DEFAULT_SPLIT, ge=0, le=100), conn=Depends(get_conn)):
    return surplus_plan(*context(conn), split)
