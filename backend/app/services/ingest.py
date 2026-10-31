"""Save a parsed statement: file-hash check, row fingerprints, duplicate counting."""
import hashlib
import re
import sqlite3

from app.services.categorize import Categorizer
from app.services.merchant import merchant_of, ref_of
from app.services.parser import Row, parse_statement
from app.services.recurring import refresh_recurring
from app.services.transfers import match_transfers


class FileAlreadyUploaded(Exception):
    """Exactly this file (same bytes) was imported before."""


def display_name(filename):
    """File name for the statements list. Long digit runs (account numbers) keep only their last 4."""
    name = (filename or "statement").rsplit("/", 1)[-1][:80]
    return re.sub(r"\d{6,}", lambda m: "•" * (len(m[0]) - 4) + m[0][-4:], name)


def file_hash(data):
    return hashlib.sha256(data).hexdigest()


def tail_key(row: Row):
    """Last part of the fingerprint: the balance if the bank gives one, else the UPI/order reference."""
    if row.balance_paise is not None:
        return str(row.balance_paise)
    return ref_of(row.description) or ""


def fingerprint(account_id, row: Row):
    """Same account|date|amount|description|balance = the same bank row exported twice.

    A real second charge changes the balance, so it gets a different fingerprint and is kept.
    """
    raw = f"{account_id}|{row.txn_date}|{row.amount_paise}|{row.description}|{tail_key(row)}"
    return hashlib.sha256(raw.encode()).hexdigest()


def get_or_create_account(conn, user_id, bank, last4):
    conn.execute("INSERT OR IGNORE INTO accounts (user_id, bank, last4) VALUES (?, ?, ?)", (user_id, bank, last4))
    return conn.execute("SELECT id FROM accounts WHERE user_id = ? AND bank = ? AND last4 = ?",
                        (user_id, bank, last4)).fetchone()["id"]


def insert_rows(conn, account_id, file_id, rows, categorizer):
    """INSERT OR IGNORE every row; the UNIQUE fingerprint silently skips repeats. Returns rows added.

    Each new row also gets its merchant name and category.
    """
    added, skipped_paise = 0, 0
    for r in rows:
        merchant = merchant_of(r.description)
        cur = conn.execute(
            "INSERT OR IGNORE INTO transactions (account_id, file_id, txn_date, amount_paise, balance_paise,"
            " description, merchant, category_id, fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (account_id, file_id, r.txn_date, r.amount_paise, r.balance_paise, r.description, merchant,
             categorizer.category_for(r.description, merchant, r.amount_paise), fingerprint(account_id, r)))
        added += cur.rowcount  # 1 if inserted, 0 if ignored
        skipped_paise += 0 if cur.rowcount else abs(r.amount_paise)
    return added, skipped_paise


def ingest(conn, user_id, filename, data):
    """Import one uploaded file. Raises StatementRejected or FileAlreadyUploaded; the raw bytes are never saved."""
    digest = file_hash(data)
    if conn.execute("SELECT 1 FROM uploaded_files WHERE user_id = ? AND file_hash = ?", (user_id, digest)).fetchone():
        raise FileAlreadyUploaded("This exact file was already uploaded.")
    statement = parse_statement(filename, data)
    try:
        account_id = get_or_create_account(conn, user_id, statement.bank, statement.last4)
        dates = [r.txn_date for r in statement.rows]
        file_id = conn.execute(
            "INSERT INTO uploaded_files (user_id, account_id, file_hash, row_count, new_rows, duplicate_rows, first_date, last_date)"
            " VALUES (?, ?, ?, ?, 0, 0, ?, ?)", (user_id, account_id, digest, len(statement.rows), min(dates), max(dates))).lastrowid
        added, skipped_paise = insert_rows(conn, account_id, file_id, statement.rows, Categorizer(conn, user_id))
        skipped = len(statement.rows) - added
        conn.execute("UPDATE uploaded_files SET new_rows = ?, duplicate_rows = ?, duplicate_paise = ?, file_name = ?, file_type = ?"
                     " WHERE id = ?", (added, skipped, skipped_paise, display_name(filename), "pdf" if data.startswith(b"%PDF") else "csv", file_id))
        transfers = match_transfers(conn, user_id)
        refresh_recurring(conn, user_id)  # new rows may complete a pattern
        conn.commit()
    except sqlite3.IntegrityError:  # two uploads of the same file raced past the hash check
        conn.rollback()
        raise FileAlreadyUploaded("This exact file was already uploaded.")
    except Exception:
        conn.rollback()
        raise
    return {"fileId": file_id, "bank": statement.bank, "last4": statement.last4, "rows": len(statement.rows),
            "newRows": added, "duplicateRows": skipped, "transfersMatched": transfers,
            "firstDate": min(dates), "lastDate": max(dates)}


def has_statements(conn, user_id):
    return conn.execute("SELECT 1 FROM uploaded_files WHERE user_id = ?", (user_id,)).fetchone() is not None


def clear_statements(conn, user_id):
    """Remove every imported statement of a user and everything derived from them (transactions, accounts,
    recurring payments, the forecast log). Corrections and flag decisions go with their transactions.
    Goals and settings are kept. The caller commits."""
    conn.execute("DELETE FROM transactions WHERE account_id IN (SELECT id FROM accounts WHERE user_id = ?)", (user_id,))
    for table in ("uploaded_files", "recurring", "forecast_log", "accounts"):
        conn.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
