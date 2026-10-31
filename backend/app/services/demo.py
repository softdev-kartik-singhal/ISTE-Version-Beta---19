"""The demo account: created on demand, and given the planted demo dataset when it has no statements."""
from app import config
from app.services import auth
from app.services.ingest import FileAlreadyUploaded, ingest


def ensure_demo_user(conn):
    """Id of the demo user, creating the account if needed."""
    row = conn.execute("SELECT id FROM users WHERE email = ?", (config.DEMO_EMAIL,)).fetchone()
    if row:
        return row["id"]
    return auth.signup(conn, config.DEMO_NAME, config.DEMO_EMAIL, config.DEMO_PASSWORD, "Salaried + Freelance")["user"]["id"]


def ensure_demo_data(conn, user_id):
    """Load the dataset only if this user has no uploaded files yet (the user's own uploads are never replaced)."""
    if conn.execute("SELECT 1 FROM uploaded_files WHERE user_id = ?", (user_id,)).fetchone():
        return
    for path in sorted((config.DEMO_DIR / config.DEMO_DATASET).glob("*.csv")):
        try:
            ingest(conn, user_id, path.name, path.read_bytes())
        except FileAlreadyUploaded:
            pass
