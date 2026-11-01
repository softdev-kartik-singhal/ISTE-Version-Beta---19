"""SQLite connection helpers (plain sqlite3, no ORM)."""
import hashlib
import sqlite3
from pathlib import Path

from app.config import CATEGORY_RULES, DB_PATH, DEMO_DIR

SCHEMA_FILE = Path(__file__).with_name("schema.sql")


def connect(path=DB_PATH) -> sqlite3.Connection:
    """Open a connection with rows as dicts and foreign keys enforced."""
    conn = sqlite3.connect(path, check_same_thread=False)  # FastAPI may hop threads within one request
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")  # SQLite ignores FKs unless asked
    conn.execute("PRAGMA secure_delete = ON")  # deleted rows are overwritten, not just unlinked
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    """Create all tables (safe to run repeatedly)."""
    drop_old_forecast_log(conn)
    conn.executescript(SCHEMA_FILE.read_text())
    add_tour_columns(conn)
    add_cash_columns(conn)
    add_demo_flag(conn)
    refresh_merchants(conn)
    seed_rules(conn)
    conn.commit()


def drop_old_forecast_log(conn):
    """The first version of forecast_log had no hash columns and was never written to; replace it."""
    columns = [r["name"] for r in conn.execute("PRAGMA table_info(forecast_log)")]
    if columns and "entry_hash" not in columns:
        conn.execute("DROP TABLE forecast_log")


def add_tour_columns(conn):
    """Databases made before the tour existed get the two tour columns; their users are marked as having done it."""
    columns = [r["name"] for r in conn.execute("PRAGMA table_info(users)")]
    if "tour_completed" not in columns:
        conn.execute("ALTER TABLE users ADD COLUMN tour_completed INTEGER NOT NULL DEFAULT 0")
        conn.execute("ALTER TABLE users ADD COLUMN tour_step INTEGER NOT NULL DEFAULT 0")
        conn.execute("UPDATE users SET tour_completed = 1")


def add_cash_columns(conn):
    """Databases made before the cash wallet existed get the manual-entry columns."""
    columns = [r["name"] for r in conn.execute("PRAGMA table_info(transactions)")]
    if "source" not in columns:
        conn.execute("ALTER TABLE transactions ADD COLUMN source TEXT NOT NULL DEFAULT 'statement'")
        conn.execute("ALTER TABLE transactions ADD COLUMN note TEXT")


def add_demo_flag(conn):
    """Databases made before sample statements were tagged get the flag, and the sample files already loaded
    are recognised by their exact hash (so a user's own file that happens to share a name is never touched)."""
    columns = [r["name"] for r in conn.execute("PRAGMA table_info(uploaded_files)")]
    if "is_demo" not in columns:
        conn.execute("ALTER TABLE uploaded_files ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0")
    for path in DEMO_DIR.glob("*/*.csv"):
        conn.execute("UPDATE uploaded_files SET is_demo = 1 WHERE file_hash = ?", (hashlib.sha256(path.read_bytes()).hexdigest(),))


def refresh_merchants(conn):
    """Rows imported before the merchant name was read properly from HDFC 'UPI-NAME-VPA...' narrations (and masked POS card
    numbers) hold the whole narration as their merchant. Recompute it for those rows, then rebuild the recurring list of
    the users it touched. Rows whose merchant already matches are left alone, so this does nothing on a current database."""
    from app.services.merchant import merchant_of  # local import: services import this module
    from app.services.recurring import refresh_recurring
    users = set()
    rows = conn.execute("SELECT t.id, t.description, t.merchant, a.user_id FROM transactions t JOIN accounts a ON a.id = t.account_id"
                        " WHERE t.source = 'statement' AND (t.description LIKE 'UPI-%' OR t.description LIKE 'POS %')").fetchall()
    for r in rows:
        merchant = merchant_of(r["description"])
        if merchant != r["merchant"]:
            conn.execute("UPDATE transactions SET merchant = ? WHERE id = ?", (merchant, r["id"]))
            users.add(r["user_id"])
    for user_id in users:
        refresh_recurring(conn, user_id)


def seed_rules(conn):
    """Load the keyword rules from config.py (existing patterns are left alone)."""
    for pattern, category, priority in CATEGORY_RULES:
        conn.execute("INSERT OR IGNORE INTO category_rules (category_id, pattern, priority)"
                     " SELECT id, ?, ? FROM categories WHERE name = ?", (pattern, priority, category))


def get_conn():
    """FastAPI dependency: one connection per request, always closed."""
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()


if __name__ == "__main__":
    with connect() as c:
        init_db(c)
    print(f"Database ready at {DB_PATH}")
