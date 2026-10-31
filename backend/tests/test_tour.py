"""First-time tour progress is kept on the user, so it resumes and never repeats on another device."""


def test_new_user_has_not_done_the_tour(client):
    assert client.get("/api/session").json()["tour"] == {"completed": False, "step": 0}


def test_progress_is_saved_and_survives_a_new_login(client, anon):
    client.put("/api/tour", json={"completed": False, "step": 4})
    assert client.get("/api/session").json()["tour"] == {"completed": False, "step": 4}
    token = anon.post("/api/auth/login", json={"email": "tester@example.com", "password": "correct horse battery"}).json()["token"]
    other_device = {"Authorization": f"Bearer {token}"}
    assert anon.get("/api/session", headers=other_device).json()["tour"]["step"] == 4


def test_finishing_or_skipping_marks_it_done_and_replay_resets_it(client):
    client.put("/api/tour", json={"completed": True, "step": 9})
    assert client.get("/api/session").json()["tour"]["completed"] is True
    client.put("/api/tour", json={"completed": False, "step": 0})
    assert client.get("/api/session").json()["tour"] == {"completed": False, "step": 0}


def test_demo_account_skips_the_tour(anon):
    token = anon.post("/api/auth/demo").json()["token"]
    assert anon.get("/api/session", headers={"Authorization": f"Bearer {token}"}).json()["tour"]["completed"] is True


def test_tour_needs_sign_in_and_a_sane_step(anon, client):
    assert anon.put("/api/tour", json={"completed": False, "step": 1}, headers={"Authorization": ""}).status_code == 401
    assert client.put("/api/tour", json={"completed": False, "step": -1}).status_code == 422
