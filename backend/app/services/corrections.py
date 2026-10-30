"""Manual category corrections, applied per merchant, with undo."""
import uuid


def changed_row(r, new_name):
    return {"id": r["id"], "date": r["txn_date"], "description": r["description"],
            "from": r["category"], "to": new_name}


def apply_correction(conn, user_id, txn_id, category_id, apply_to_merchant=True):
    """Set the category of one transaction, and of every other row of the same merchant if asked.

    Returns None if the transaction or category does not exist. Otherwise the batch id and the
    rows that really changed (rows already in that category are left out).
    """
    base = ("SELECT t.id, t.txn_date, t.description, t.merchant, t.category_id, c.name AS category FROM transactions t"
            " JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
            " WHERE a.user_id = ? ")
    txn = conn.execute(base + "AND t.id = ?", (user_id, txn_id)).fetchone()
    target = conn.execute("SELECT name FROM categories WHERE id = ?", (category_id,)).fetchone()
    if txn is None or target is None:
        return None
    if apply_to_merchant and txn["merchant"]:
        rows = conn.execute(base + "AND t.merchant = ? AND t.kind != 'transfer'", (user_id, txn["merchant"])).fetchall()
    else:
        rows = [txn]
    changed = [r for r in rows if r["category_id"] != category_id]
    batch = uuid.uuid4().hex
    for r in changed:
        conn.execute("INSERT INTO corrections (transaction_id, category_id, previous_category_id, batch_id, applies_to_merchant)"
                     " VALUES (?, ?, ?, ?, ?)", (r["id"], category_id, r["category_id"], batch, int(apply_to_merchant)))
        conn.execute("UPDATE transactions SET category_id = ? WHERE id = ?", (category_id, r["id"]))
    return {"batchId": batch, "merchant": txn["merchant"], "category": target["name"],
            "changed": [changed_row(r, target["name"]) for r in changed]}


def undo_correction(conn, user_id, batch_id):
    """Put every row of the batch back to its previous category and forget the correction.

    Returns None if the batch is unknown (or already undone).
    """
    rows = conn.execute(
        "SELECT c.id AS cid, c.previous_category_id, t.id, t.txn_date, t.description, cur.name AS category"
        " FROM corrections c JOIN transactions t ON t.id = c.transaction_id JOIN accounts a ON a.id = t.account_id"
        " LEFT JOIN categories cur ON cur.id = t.category_id WHERE c.batch_id = ? AND a.user_id = ?",
        (batch_id, user_id)).fetchall()
    if not rows:
        return None
    restored = []
    for r in rows:
        conn.execute("UPDATE transactions SET category_id = ? WHERE id = ?", (r["previous_category_id"], r["id"]))
        conn.execute("DELETE FROM corrections WHERE id = ?", (r["cid"],))
        name = conn.execute("SELECT name FROM categories WHERE id = ?", (r["previous_category_id"],)).fetchone()
        restored.append(changed_row(r, name["name"] if name else None))
    return {"batchId": batch_id, "restored": restored}
