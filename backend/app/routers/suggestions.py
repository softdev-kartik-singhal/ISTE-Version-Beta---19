"""Suggestions for you: the optional 'About you' answers and the AI-assisted product-type suggestions."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db import get_conn
from app.deps import current_user_id
from app.routers.goals import goal_rows
from app.routers.overview import context
from app.services.suggest_profile import about_answers
from app.services.suggestions import get_suggestions, load_about, save_about

router = APIRouter(prefix="/api")


class AboutIn(BaseModel):
    age_band: str | None = None
    dependents: str | None = None
    risk_comfort: str | None = None
    employer_health_cover: bool | None = None
    has_daughter: bool | None = None


class SuggestIn(BaseModel):
    refresh: bool = False


@router.get("/suggestions/about")
def get_about(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return about_answers(load_about(conn, user_id))


@router.put("/suggestions/about")
def put_about(body: AboutIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    save_about(conn, user_id, body.model_dump())
    return about_answers(load_about(conn, user_id))


@router.post("/suggestions")
def post_suggestions(body: SuggestIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    ledger, inp = context(conn, user_id)
    return get_suggestions(conn, ledger, inp, goal_rows(conn, user_id), user_id, body.refresh)
