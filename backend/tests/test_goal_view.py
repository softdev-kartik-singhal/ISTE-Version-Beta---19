"""Goals screen rules: months counted from today, one status for ALL goals together (low month / usual month / needs
more), goals that cannot be met at all, the summary sentence quoting the number it was decided with, and the nudges."""
from datetime import date

import pytest

from app.services import goals as goals_service
from app.services.money import inr


@pytest.fixture(autouse=True)
def pinned_today(monkeypatch):
    monkeypatch.setattr(goals_service, "today", lambda: date(2026, 11, 1))


def add(client, name, target_paise, target_date="2026-12-31", saved=0):
    r = client.post("/api/goals", json={"name": name, "targetPaise": target_paise, "savedPaise": saved, "targetDate": target_date})
    assert r.status_code == 201
    return r.json()


def view(client):
    return client.get("/api/goals").json()["view"]


def test_months_are_counted_from_today_not_from_the_last_statement(complete):
    goal = add(complete, "Bike", 120_000_00, "2026-12-31")["goals"][0]      # statements end 28 Sep; today is 1 Nov
    assert goal["monthsFromToday"] == 2 and goal["monthsLeft"] == 3         # the old statement-based number is unchanged
    assert goal["monthlyNowPaise"] == 60_000_00


def test_a_date_that_has_passed_is_overdue_not_a_monthly_amount(complete):
    goal = add(complete, "Old", 10_000_00, "2026-10-15")["goals"][0]
    assert goal["monthsFromToday"] == 0 and goal["statusCode"] == "overdue" and goal["monthlyNowPaise"] == 0


def test_covered_even_in_a_low_month_quotes_the_low_number(complete):
    add(complete, "Phone", 20_000_00, "2026-12-31")
    v = view(complete)
    assert v["bucket"] == "low_ok" and v["totalNeedPaise"] == 10_000_00
    assert v["summary"] == (f"You need ₹10,000 a month for 1 goal. Even in a low month you have {inr(v['lowPaise'])} left, "
                            "so you're covered.")
    goal = complete.get("/api/goals").json()["goals"][0]
    assert (goal["statusCode"], goal["statusLine"]) == ("low_ok", "On track even in a low month")


def test_the_total_of_all_goals_decides_not_each_goal_alone(complete):
    v = view(complete)
    low, usual = v["lowPaise"], v["usualPaise"]
    each = (low // 2 + 1_000_00) * 2                       # two goals: each fits in a low month, together they do not
    for name in ("One", "Two"):
        add(complete, name, each, "2026-12-31")
    data = complete.get("/api/goals").json()
    assert data["view"]["totalNeedPaise"] > low and data["view"]["bucket"] in ("usual_ok", "needs_more")
    assert all(g["statusCode"] != "low_ok" for g in data["goals"])
    assert data["view"]["summary"].startswith(f"You need {inr(data['view']['totalNeedPaise'])} a month for 2 goals.")


def test_needs_more_when_the_total_is_above_the_usual_month(complete):
    usual = view(complete)["usualPaise"]
    for name in ("One", "Two"):
        add(complete, name, int(usual * 0.9) * 2, "2026-12-31")   # each needs 90% of a usual month
    data = complete.get("/api/goals").json()
    assert data["view"]["bucket"] == "needs_more"
    assert [g["statusLine"] for g in data["goals"]] == ["Needs more", "Needs more"]
    shortfall = data["view"]["totalNeedPaise"] - usual
    assert data["view"]["summary"].endswith(f"which is {inr(shortfall)} a month short.")


def test_a_goal_bigger_than_a_whole_usual_month_is_not_reachable_and_names_the_earliest_month(complete):
    usual = view(complete)["usualPaise"]
    g = add(complete, "Car", usual * 6, "2026-12-31")["goals"][0]        # needs 3x a usual month, in 2 months
    assert g["statusCode"] == "unreachable" and g["earliestMonth"] == "2027-05"
    assert g["statusLine"] == "Not reachable by this date — earliest: May 2027"


def test_nudge_moves_the_biggest_goal_later_to_free_money(complete):
    usual = view(complete)["usualPaise"]
    add(complete, "Car", int(usual * 1.5) * 2, "2026-12-31")
    nudge = complete.get("/api/goals").json()["nudges"][0]
    assert nudge["kind"] == "push" and nudge["freedPaise"] >= 50_000 and "Move Car to" in nudge["text"] and "a month" in nudge["text"]


def test_nudge_uses_a_past_bonus_to_finish_a_small_goal(complete):
    add(complete, "Cycle", 30_000_00, "2027-03-31")
    nudges = complete.get("/api/goals").json()["nudges"]
    assert [n["kind"] for n in nudges] == ["bonus"]
    assert "Cycle" in nudges[0]["text"] and "in one go" in nudges[0]["text"]


def test_at_most_two_nudges(complete):
    usual = view(complete)["usualPaise"]
    add(complete, "Car", int(usual * 1.5) * 2, "2026-12-31")
    add(complete, "Cycle", 30_000_00, "2027-03-31")
    assert len(complete.get("/api/goals").json()["nudges"]) <= 2


def test_no_goals_means_no_summary_and_no_nudges(complete):
    data = complete.get("/api/goals").json()
    assert data["view"]["bucket"] == "none" and data["view"]["summary"] == "" and data["nudges"] == []


def test_a_fully_funded_goal_is_done_and_never_counted_in_the_monthly_total(complete):
    add(complete, "Done", 10_000_00, "2026-12-31", saved=10_000_00)
    data = complete.get("/api/goals").json()
    assert data["goals"][0]["statusCode"] == "funded" and data["view"]["totalNeedPaise"] == 0
    assert data["view"]["summary"] == "All your goals are funded."


def test_preview_returns_the_same_status_for_a_goal_not_saved_yet(complete):
    body = {"name": "Trip", "targetPaise": 20_000_00, "savedPaise": 0, "targetDate": "2026-12-31"}
    r = complete.post("/api/goals/preview", json=body).json()
    assert r["statusCode"] == "low_ok" and r["monthlyNowPaise"] == 10_000_00 and r["view"]["goalCount"] == 1
    assert complete.get("/api/goals").json()["goals"] == []              # nothing was saved


def test_without_history_there_is_no_view(client):
    assert client.get("/api/goals").json()["view"] is None


def test_preview_of_an_edit_does_not_count_the_old_version_twice(complete):
    saved = add(complete, "Trip", 20_000_00, "2026-12-31")["goals"][0]
    body = {"name": "Trip", "targetPaise": 20_000_00, "savedPaise": 0, "targetDate": "2026-12-31"}
    twice = complete.post("/api/goals/preview", json=body).json()["view"]["totalNeedPaise"]
    once = complete.post(f"/api/goals/preview?exclude={saved['id']}", json=body).json()["view"]["totalNeedPaise"]
    assert (twice, once) == (20_000_00, 10_000_00)


def test_nudges_show_goal_names_in_title_case(complete):
    usual = view(complete)["usualPaise"]
    add(complete, "new bike", int(usual * 1.5) * 2, "2026-12-31")
    assert "Move New Bike to" in complete.get("/api/goals").json()["nudges"][0]["text"]
