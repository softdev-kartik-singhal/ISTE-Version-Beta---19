"""Transactions, categories and category corrections."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.db import get_conn
from app.services.corrections import apply_correction, undo_correction
from app.deps import current_user_id
from app.services.merchant import ref_of
from app.services.recurring import refresh_recurring

router = APIRouter(prefix="/api")
CHANNELS = {"UPI": "UPI", "NEFT": "NEFT", "IMPS": "IMPS", "POS": "Card", "INTL": "Card", "ACH": "Auto-debit"}


def channel_of(description):
    """How the money moved, from the narration's first word (UPI/..., NEFT CR-..., POS ...)."""
    first = description.upper().replace("/", " ").replace("-", " ").split(" ")[0]
    return CHANNELS.get(first, "Other")


class CorrectionIn(BaseModel):
    categoryId: int
    applyToMerchant: bool = True


@router.get("/categories")
def list_categories(conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """All categories with the user's total spend (money out, excluding transfers/duplicates) in each."""
    rows = conn.execute(
        "SELECT c.id, c.name, c.kind, COALESCE(SUM(CASE WHEN t.kind = 'normal' THEN ABS(t.amount_paise) END), 0) AS total,"
        " COUNT(t.id) AS n FROM categories c LEFT JOIN (SELECT t.* FROM transactions t JOIN accounts a ON a.id = t.account_id"
        " WHERE a.user_id = ?) t ON t.category_id = c.id GROUP BY c.id ORDER BY c.id", (user_id,)).fetchall()
    return [{"id": r["id"], "name": r["name"], "kind": r["kind"], "totalPaise": r["total"], "count": r["n"]} for r in rows]


@router.get("/transactions")
def list_transactions(q: str = "", category: int | None = None, account: int | None = None,
                      date_from: str | None = None, date_to: str | None = None, kind: str | None = None,
                      direction: str | None = Query(None, pattern="^(debit|credit)$"),
                      limit: int = Query(100, le=500), offset: int = 0, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """Filtered, newest first. `summary` totals ignore transfers and confirmed duplicates."""
    where, args = ["a.user_id = ?"], [user_id]
    for clause, value in [("(t.description LIKE ? OR t.merchant LIKE ?)", f"%{q}%" if q else None),
                          ("t.category_id = ?", category), ("t.account_id = ?", account),
                          ("t.txn_date >= ?", date_from), ("t.txn_date <= ?", date_to), ("t.kind = ?", kind)]:
        if value is not None:
            where.append(clause)
            args += [value, value] if clause.startswith("(") else [value]
    if direction:
        where.append("t.amount_paise < 0" if direction == "debit" else "t.amount_paise > 0")
    sql = ("FROM transactions t JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
           " WHERE " + " AND ".join(where))
    total = conn.execute("SELECT COUNT(*) AS n " + sql, args).fetchone()["n"]
    sums = conn.execute("SELECT COALESCE(SUM(CASE WHEN t.amount_paise > 0 THEN t.amount_paise END), 0) AS inflow,"
                        " COALESCE(SUM(CASE WHEN t.amount_paise < 0 THEN -t.amount_paise END), 0) AS outflow "
                        + sql + " AND t.kind = 'normal'", args).fetchone()
    rows = conn.execute("SELECT t.id, t.txn_date, t.description, t.merchant, t.amount_paise, t.balance_paise, t.kind,"
                        " t.category_id, c.name AS category, a.id AS account_id, a.bank, a.last4 " + sql +
                        " ORDER BY t.txn_date DESC, t.id DESC LIMIT ? OFFSET ?", args + [limit, offset]).fetchall()
    return {"total": total, "summary": {"inflowPaise": sums["inflow"], "outflowPaise": sums["outflow"]},
            "transactions": [{"id": r["id"], "date": r["txn_date"], "description": r["description"],
                              "merchant": r["merchant"], "amountPaise": r["amount_paise"],
                              "balancePaise": r["balance_paise"], "kind": r["kind"], "categoryId": r["category_id"],
                              "category": r["category"], "accountId": r["account_id"], "bank": r["bank"],
                              "last4": r["last4"], "channel": channel_of(r["description"]),
                              "reference": ref_of(r["description"])} for r in rows]}


@router.post("/transactions/{txn_id}/category")
def correct_category(txn_id: int, body: CorrectionIn, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    """Change a category (and, by default, every transaction of the same merchant). Returns the rows changed."""
    result = apply_correction(conn, user_id, txn_id, body.categoryId, body.applyToMerchant)
    if result is None:
        raise HTTPException(404, {"reason": "Transaction or category not found."})
    refresh_recurring(conn, user_id)  # a recategorised row can change a recurring label
    conn.commit()
    return result


@router.post("/corrections/{batch_id}/undo")
def undo(batch_id: str, conn=Depends(get_conn), user_id: int = Depends(current_user_id)):
    result = undo_correction(conn, user_id, batch_id)
    if result is None:
        raise HTTPException(404, {"reason": "Nothing to undo for that correction."})
    refresh_recurring(conn, user_id)
    conn.commit()
    return result
