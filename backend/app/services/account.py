"""What the signed-in user can see about themselves: session, privacy facts, export, and full deletion."""
from datetime import date

from app.services.card import card_of
from app.services.flags import flags_payload
from app.services.track_record import verify_chain


def account_labels(conn, user_id):
    rows = conn.execute("SELECT bank, last4 FROM accounts WHERE user_id = ? ORDER BY id", (user_id,)).fetchall()
    return [f"{r['bank']} ••{r['last4']}" for r in rows]


def account_list(conn, user_id):
    return [{"id": r["id"], "bank": r["bank"], "last4": r["last4"]}
            for r in conn.execute("SELECT id, bank, last4 FROM accounts WHERE user_id = ? ORDER BY id", (user_id,))]


def session_payload(conn, user_id):
    """GET /api/session: who is signed in, their accounts and when data last arrived."""
    user = conn.execute("SELECT name, email, profile, tour_completed, tour_step FROM users WHERE id = ?", (user_id,)).fetchone()
    accounts = account_labels(conn, user_id)
    last = conn.execute("SELECT MAX(f.uploaded_at) AS at FROM uploaded_files f JOIN accounts a ON a.id = f.account_id"
                        " WHERE a.user_id = ?", (user_id,)).fetchone()["at"]
    return {"user": {"name": user["name"], "email": user["email"], "profile": user["profile"]},
            "accountCount": len(accounts), "accounts": accounts, "accountList": account_list(conn, user_id),
            "hasData": bool(accounts), "lastSyncedAt": last,
            "tour": {"completed": bool(user["tour_completed"]), "step": user["tour_step"]},
            "flagCount": flags_payload(conn, user_id)["openCount"]}


def privacy_payload(conn, user_id):
    """GET /api/privacy: the facts behind the privacy page, from the real database."""
    card = card_of(conn, user_id)
    count = lambda table, join: conn.execute(
        f"SELECT COUNT(*) AS n FROM {table} {join} WHERE a.user_id = ?", (user_id,)).fetchone()["n"]
    head = verify_chain(conn, user_id)["headHash"]
    accounts = account_labels(conn, user_id)
    return {"card": {"last4": card["last4"], "addedAt": card["created_at"]} if card else None,
            "maskedAccount": accounts[0] if accounts else None, "accounts": accounts,
            "counts": {"transactions": count("transactions t", "JOIN accounts a ON a.id = t.account_id"),
                       "files": count("uploaded_files t", "JOIN accounts a ON a.id = t.account_id")},
            "rawFilesStored": 0, "accountNumbersStored": "last 4 digits only",
            "auditTrail": f"SG-{head[:8].upper()}" if head else None,
            "exportFileName": f"SmartGullak_Transactions_{date.today().year}.csv"}


def export_data(conn, user_id):
    """Everything the user owns, as plain rows (money in paise)."""
    transactions = conn.execute(
        "SELECT t.txn_date AS date, t.merchant, t.description, a.bank, a.last4, c.name AS category,"
        " t.amount_paise AS amountPaise, t.kind FROM transactions t JOIN accounts a ON a.id = t.account_id"
        " LEFT JOIN categories c ON c.id = t.category_id WHERE a.user_id = ? ORDER BY t.txn_date, t.id", (user_id,)).fetchall()
    goals = conn.execute("SELECT name, target_paise AS targetPaise, saved_paise AS savedPaise, target_date AS targetDate"
                         " FROM goals WHERE user_id = ? ORDER BY id", (user_id,)).fetchall()
    log = conn.execute("SELECT kind, source, made_on AS madeOn, target_month AS targetMonth, worst_paise AS worstPaise,"
                       " typical_paise AS typicalPaise, best_paise AS bestPaise, actual_paise AS actualPaise,"
                       " entry_hash AS entryHash FROM forecast_log WHERE user_id = ? ORDER BY id", (user_id,)).fetchall()
    return {"transactions": [dict(r) for r in transactions], "goals": [dict(r) for r in goals],
            "forecastLog": [dict(r) for r in log]}


def delete_everything(conn, user_id):
    """Delete the user row; every table that holds their data cascades from it. The categories and
    rules are shared reference data and stay. Deleted rows are overwritten (secure_delete)."""
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()


def save_tour(conn, user_id, completed, step):
    """Remember how far the user got in the first-time tour (so it resumes, and never repeats on another device)."""
    conn.execute("UPDATE users SET tour_completed = ?, tour_step = ? WHERE id = ?", (1 if completed else 0, step, user_id))
    conn.commit()
    return {"completed": bool(completed), "step": step}
