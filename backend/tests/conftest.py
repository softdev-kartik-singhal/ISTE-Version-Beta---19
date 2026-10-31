import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import config  # noqa: E402
from app.db import connect, get_conn, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.services import auth  # noqa: E402

EMAIL, PASSWORD = "tester@example.com", "correct horse battery"


@pytest.fixture(autouse=True)
def test_settings(monkeypatch):
    """Cheap bcrypt, a known device secret, and a clean login-throttle for every test."""
    monkeypatch.setattr(config, "BCRYPT_ROUNDS", 4)
    monkeypatch.setattr(config, "DEVICE_SECRET", "test-device-secret")
    auth.FAILED_LOGINS.clear()


@pytest.fixture
def db_path(tmp_path):
    path = tmp_path / "test.db"
    with connect(path) as conn:
        init_db(conn)
    return path


@pytest.fixture
def anon(db_path):
    """A client with no sign-in, on a fresh temp database."""
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
def client(anon):
    """A client signed in as user 1."""
    token = anon.post("/api/auth/signup", json={"name": "Tester", "email": EMAIL, "password": PASSWORD}).json()["token"]
    anon.headers["Authorization"] = f"Bearer {token}"
    return anon


@pytest.fixture
def complete(client):
    """Signed-in account with the 8-month gap-free dataset loaded."""
    client.post("/api/demo-data?set=eight_months_complete")
    return client
