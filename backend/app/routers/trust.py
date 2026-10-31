"""Trust endpoints: forecast log, chain verification, backtest, track record, categorisation accuracy."""
from fastapi import APIRouter, Depends

from app.db import get_conn
from app.services.accuracy import accuracy_report
from app.deps import current_user_id
from app.services.track_record import backtest, log_live_forecast, settle, track_record, verify_chain

router = APIRouter(prefix="/api")


@router.get("/forecast-log")
def list_log(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    rows = conn.execute("SELECT * FROM forecast_log WHERE user_id = ? ORDER BY id", (user_id,)).fetchall()
    return {"entries": [dict(r) for r in rows]}


@router.get("/forecast-log/verify")
def verify(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return verify_chain(conn, user_id)


@router.post("/track-record/backtest")
def run_backtest(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return backtest(conn, user_id)


@router.post("/track-record/forecast")
def log_forecast(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return log_live_forecast(conn, user_id)


@router.post("/track-record/settle")
def settle_forecasts(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return settle(conn, user_id)


@router.get("/track-record")
def get_track_record(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return track_record(conn, user_id)


@router.get("/categorisation-accuracy")
def get_accuracy(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return accuracy_report(conn, user_id)
