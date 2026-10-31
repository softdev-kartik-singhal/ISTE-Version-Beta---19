"""Goals CRUD plus an on-track assessment from the affordability engine."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db import get_conn
from app.routers.overview import context
from app.services.goals import assess, portfolio, valid_date
from app.deps import current_user_id

router = APIRouter(prefix="/api")


class GoalIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    targetPaise: int = Field(gt=0)
    savedPaise: int = Field(0, ge=0)
    targetDate: str  # YYYY-MM-DD
    category: str | None = None
    priority: str | None = None


def goal_rows(conn, user_id):
    return [dict(r) for r in conn.execute("SELECT id, name, target_paise, saved_paise, target_date, category, priority FROM goals"
                                          " WHERE user_id = ?", (user_id,))]


def as_row(body, goal_id=None):
    if not valid_date(body.targetDate):
        raise HTTPException(422, {"reason": "targetDate must look like 2027-03-31."})
    return {"id": goal_id, "name": body.name.strip(), "target_paise": body.targetPaise,
            "saved_paise": body.savedPaise, "target_date": body.targetDate,
            "category": body.category, "priority": body.priority}


def listing(conn, user_id):
    ledger, inp = context(conn, user_id)
    entries = assess(inp, ledger, goal_rows(conn, user_id))
    return {"goals": entries, "summary": portfolio(entries, inp, ledger), "asOf": inp.as_of.isoformat()}


@router.get("/goals")
def list_goals(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    return listing(conn, user_id)


@router.post("/goals/preview")
def preview_goal(body: GoalIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """Assess a goal that is not saved yet, together with the existing ones."""
    ledger, inp = context(conn, user_id)
    draft = as_row(body)
    entries = assess(inp, ledger, goal_rows(conn, user_id) + [draft])
    return next(e for e in entries if e["id"] is None)


@router.post("/goals", status_code=201)
def create_goal(body: GoalIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    row = as_row(body)
    conn.execute("INSERT INTO goals (user_id, name, target_paise, saved_paise, target_date, category, priority) VALUES (?, ?, ?, ?, ?, ?, ?)",
                 (user_id, row["name"], row["target_paise"], row["saved_paise"], row["target_date"], row["category"], row["priority"]))
    conn.commit()
    return listing(conn, user_id)


@router.put("/goals/{goal_id}")
def update_goal(goal_id: int, body: GoalIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    row = as_row(body, goal_id)
    cur = conn.execute("UPDATE goals SET name = ?, target_paise = ?, saved_paise = ?, target_date = ?, category = ?, priority = ?"
                       " WHERE id = ? AND user_id = ?", (row["name"], row["target_paise"], row["saved_paise"],
                                                         row["target_date"], row["category"], row["priority"], goal_id, user_id))
    if cur.rowcount == 0:
        raise HTTPException(404, {"reason": "Goal not found."})
    conn.commit()
    return listing(conn, user_id)


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    if conn.execute("DELETE FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id)).rowcount == 0:
        raise HTTPException(404, {"reason": "Goal not found."})
    conn.commit()
    return listing(conn, user_id)
