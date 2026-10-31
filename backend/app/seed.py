"""Create the demo account the frontend's login screen is pre-filled with, and give it the 8-month data.
Run once:  python -m app.seed
"""
from app.config import DEMO_DIR
from app.db import connect, init_db
from app import config
from app.services.demo import ensure_demo_data, ensure_demo_user


def seed(conn):
    """Idempotent: creates the demo user and loads the demo dataset if it is missing."""
    user_id = ensure_demo_user(conn)
    ensure_demo_data(conn, user_id)
    return user_id


if __name__ == "__main__":
    with connect() as c:
        init_db(c)
        seed(c)
    print(f"Demo account ready: {config.DEMO_EMAIL} / {config.DEMO_PASSWORD}")
