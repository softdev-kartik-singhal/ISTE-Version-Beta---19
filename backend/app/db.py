"""SQLite connection helpers (plain sqlite3, no ORM)."""
import sqlite3
from pathlib import Path

from app.config import CATEGORY_RULES, DB_PATH

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
    seed_rules(conn)
    conn.commit()


def drop_old_forecast_log(conn):
    """The first version of forecast_log had no hash columns and was never written to; replace it."""
    columns = [r["name"] for r in conn.execute("PRAGMA table_info(forecast_log)")]
    if columns and "entry_hash" not in columns:
        conn.execute("DROP TABLE forecast_log")


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
