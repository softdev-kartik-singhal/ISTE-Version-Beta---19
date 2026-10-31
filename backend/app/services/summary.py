"""Build the GET /api/statements payload: files, merge summary, date coverage and gaps."""
from datetime import date

from app.config import GAP_DAYS_THRESHOLD


def list_files(conn, user_id):
    rows = conn.execute(
        "SELECT f.id, a.bank, a.last4, f.row_count, f.new_rows, f.duplicate_rows, f.first_date, f.last_date,"
        " f.uploaded_at, f.file_name, f.file_type, f.duplicate_paise FROM uploaded_files f JOIN accounts a ON a.id = f.account_id"
        " WHERE a.user_id = ? ORDER BY f.id", (user_id,)).fetchall()
    return [{"id": r["id"], "bank": r["bank"], "last4": r["last4"], "rows": r["row_count"],
             "newRows": r["new_rows"], "duplicateRows": r["duplicate_rows"],
             "firstDate": r["first_date"], "lastDate": r["last_date"], "uploadedAt": r["uploaded_at"], "name": r["file_name"], "type": r["file_type"],
             "duplicatePaise": r["duplicate_paise"]} for r in rows]


def merge_summary(conn, user_id):
    """Totals shown in the reconciliation cards."""
    q = ("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN t.kind = 'transfer' AND t.amount_paise > 0"
         " THEN t.amount_paise END), 0) AS moved FROM transactions t JOIN accounts a ON a.id = t.account_id"
         " WHERE a.user_id = ? AND a.type != 'cash'")
    totals = conn.execute(q, (user_id,)).fetchone()
    pairs = conn.execute("SELECT COUNT(*) AS n FROM transactions t JOIN accounts a ON a.id = t.account_id"
                         " WHERE a.user_id = ? AND t.kind = 'transfer' AND t.amount_paise > 0", (user_id,)).fetchone()["n"]
    skipped = conn.execute("SELECT COALESCE(SUM(f.duplicate_rows), 0) AS n FROM uploaded_files f JOIN accounts a"
                           " ON a.id = f.account_id WHERE a.user_id = ?", (user_id,)).fetchone()["n"]
    accounts = conn.execute("SELECT COUNT(*) AS n FROM accounts WHERE user_id = ? AND type != 'cash'", (user_id,)).fetchone()["n"]
    return {"records": totals["n"], "duplicatesSkipped": skipped, "transferPairs": pairs,
            "transferPaise": totals["moved"], "accounts": accounts}


def find_gaps(rows):
    """Gaps = consecutive rows whose balance does not reconcile AND that are > GAP_DAYS_THRESHOLD days apart.

    A broken running balance means rows are missing between the two; the days check
    ignores tiny breaks and avoids calling a quiet week (no spending) a gap.
    """
    gaps = []
    for prev, cur in zip(rows, rows[1:]):
        if prev["balance_paise"] is None or cur["balance_paise"] is None:
            continue
        broken = prev["balance_paise"] + cur["amount_paise"] != cur["balance_paise"]
        days = (date.fromisoformat(cur["txn_date"]) - date.fromisoformat(prev["txn_date"])).days
        if broken and days > GAP_DAYS_THRESHOLD:
            gaps.append({"from": prev["txn_date"], "to": cur["txn_date"], "days": days})
    return gaps


def coverage(conn, user_id):
    """Per-account first/last date and gaps."""
    out = []
    for acct in conn.execute("SELECT id, bank, last4 FROM accounts WHERE user_id = ? AND type != 'cash' ORDER BY id", (user_id,)):
        rows = conn.execute("SELECT txn_date, amount_paise, balance_paise FROM transactions WHERE account_id = ?"
                            " ORDER BY txn_date, id", (acct["id"],)).fetchall()
        if not rows:
            continue
        out.append({"bank": acct["bank"], "last4": acct["last4"], "firstDate": rows[0]["txn_date"],
                    "lastDate": rows[-1]["txn_date"], "gaps": find_gaps(rows)})
    return {"accounts": out, "gapCount": sum(len(a["gaps"]) for a in out)}


def statements_payload(conn, user_id):
    return {"files": list_files(conn, user_id), "merge": merge_summary(conn, user_id),
            "coverage": coverage(conn, user_id)}
