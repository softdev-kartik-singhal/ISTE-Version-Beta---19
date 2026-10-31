import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.db import connect, get_conn, init_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def db_path(tmp_path):
    path = tmp_path / "test.db"
    with connect(path) as conn:
        init_db(conn)
    return path


@pytest.fixture
def client(db_path):
    """TestClient whose requests use a fresh temp database."""
    def override():
        conn = connect(db_path)
        try:
            yield conn
        finally:
            conn.close()
    app.dependency_overrides[get_conn] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def complete(client):
    """Demo account with the 8-month gap-free dataset loaded."""
    client.post("/api/demo-data?set=eight_months_complete")
    return client
