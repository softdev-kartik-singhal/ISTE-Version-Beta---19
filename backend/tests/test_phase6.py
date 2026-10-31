"""Phase 6 tests: hash chain + tamper detection, backtest without look-ahead, track record, categorisation accuracy."""
import sqlite3
from statistics import mean

import pytest

from app.db import connect, init_db
from app.services.accuracy import labelled_rows, load_labels, score, wrong_groups
from app.services.affordability import monthly_surplus_forecast
from app.services.forecast import build_inputs
from app.services.stats import add_months, month_end
from app.services.track_record import FIELDS, GENESIS, append_entry, compute_hash, judge, verify_chain

MONTHS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]


def backtest(client):
    return client.post("/api/track-record/backtest").json()


def verify(client):
    return client.get("/api/forecast-log/verify").json()


def sql(db_path, statement, *args):
    db = sqlite3.connect(db_path)
    db.execute(statement, args)
    db.commit()
    db.close()


@pytest.fixture
def logged(complete):
    """Complete demo data with the backtest already in the log (10 entries: 5 forecasts + 5 actuals)."""
    backtest(complete)
    return complete


# ---------- hash chain ----------

def test_first_entry_links_to_genesis_and_each_links_to_the_one_before(logged):
    entries = logged.get("/api/forecast-log").json()["entries"]
    assert len(entries) == 10 and entries[0]["prev_hash"] == GENESIS
    assert all(b["prev_hash"] == a["entry_hash"] for a, b in zip(entries, entries[1:]))
    assert len({e["entry_hash"] for e in entries}) == 10


def test_hash_depends_on_previous_hash_and_on_every_field():
    entry = dict(kind="forecast", source="live", made_on="2026-09-28", target_month="2026-10",
                 worst_paise=1, typical_paise=2, best_paise=3, actual_paise=None)
    base = compute_hash(GENESIS, 1, entry)
    assert base == compute_hash(GENESIS, 1, entry) and len(base) == 64
    assert compute_hash("1" * 64, 1, entry) != base and compute_hash(GENESIS, 2, entry) != base
    for field in FIELDS:
        changed = {**entry, field: "x" if isinstance(entry[field], str) else (entry[field] or 0) + 1}
        assert compute_hash(GENESIS, 1, changed) != base, field


def test_untouched_log_verifies(logged):
    v = verify(logged)
    assert v["valid"] is True and v["entries"] == 10 and v["firstBrokenLink"] is None and len(v["headHash"]) == 64


def test_empty_log_is_valid(client):
    assert verify(client) == {"valid": True, "entries": 0, "headHash": None, "firstBrokenLink": None}


def test_changing_an_entry_is_caught_at_that_entry(logged, db_path):
    sql(db_path, "UPDATE forecast_log SET typical_paise = typical_paise + 1 WHERE id = 5")
    v = verify(logged)
    assert v["valid"] is False and v["firstBrokenLink"]["entryId"] == 5 and v["firstBrokenLink"]["position"] == 5
    assert "Content changed" in v["firstBrokenLink"]["reason"]


def test_changing_an_actual_is_caught_too(logged, db_path):
    sql(db_path, "UPDATE forecast_log SET actual_paise = 999 WHERE kind = 'actual' AND target_month = '2026-07'")
    assert verify(logged)["firstBrokenLink"]["targetMonth"] == "2026-07"


def test_deleting_an_entry_is_caught_at_the_next_one(logged, db_path):
    sql(db_path, "DELETE FROM forecast_log WHERE id = 4")
    link = verify(logged)["firstBrokenLink"]
    assert link["entryId"] == 5 and link["position"] == 4 and "Link broken" in link["reason"]


def test_rewriting_an_entry_and_its_hash_still_breaks_the_next_link(logged, db_path):
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    row = db.execute("SELECT * FROM forecast_log WHERE id = 3").fetchone()
    forged = {**dict(row), "typical_paise": 1}
    db.execute("UPDATE forecast_log SET typical_paise = 1, entry_hash = ? WHERE id = 3", (compute_hash(row["prev_hash"], 1, forged),))
    db.commit()
    link = verify(logged)["firstBrokenLink"]
    assert link["entryId"] == 4 and "Link broken" in link["reason"]       # the forger would have to rewrite every later hash


def test_reports_the_first_of_several_problems(logged, db_path):
    sql(db_path, "UPDATE forecast_log SET best_paise = 0 WHERE id = 9")
    sql(db_path, "UPDATE forecast_log SET worst_paise = 0 WHERE id = 3")
    assert verify(logged)["firstBrokenLink"]["entryId"] == 3


def test_reordering_is_caught(logged, db_path):
    sql(db_path, "UPDATE forecast_log SET id = 100 WHERE id = 2")        # moves entry 2 to the end
    assert verify(logged)["valid"] is False


def test_removing_the_last_entries_is_not_detectable_without_the_head_hash(logged, db_path):
    head = verify(logged)["headHash"]
    sql(db_path, "DELETE FROM forecast_log WHERE id IN (9, 10)")
    v = verify(logged)
    assert v["valid"] is True and v["headHash"] != head       # chain is intact but shorter: keep the head hash elsewhere to catch this


def test_chain_cannot_fork_or_duplicate_a_month(logged, db_path):
    db = sqlite3.connect(db_path)
    first = db.execute("SELECT user_id, prev_hash FROM forecast_log WHERE id = 2").fetchone()
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO forecast_log (user_id, kind, source, made_on, target_month, prev_hash, entry_hash)"
                   " VALUES (?, 'forecast', 'live', 'x', '2030-01', ?, 'h')", first)
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO forecast_log (user_id, kind, source, made_on, target_month, prev_hash, entry_hash)"
                   " VALUES (1, 'forecast', 'live', 'x', '2026-05', 'new', 'h')")


def test_each_users_chain_is_separate(tmp_path):
    conn = connect(tmp_path / "t.db")
    init_db(conn)
    for uid in (1, 2):
        conn.execute("INSERT INTO users (id, name, email, password_hash) VALUES (?, 'n', ?, 'h')", (uid, f"{uid}@x.in"))
        for month in ("2026-01", "2026-02"):
            append_entry(conn, uid, kind="forecast", source="live", made_on="d", target_month=month,
                         worst_paise=1, typical_paise=2, best_paise=3)
    assert verify_chain(conn, 1)["valid"] and verify_chain(conn, 2)["valid"]
    conn.execute("UPDATE forecast_log SET best_paise = 9 WHERE user_id = 2 AND target_month = '2026-01'")
    assert verify_chain(conn, 1)["valid"] and verify_chain(conn, 2)["valid"] is False


def test_old_forecast_log_table_is_replaced(tmp_path):
    conn = connect(tmp_path / "old.db")
    conn.execute("CREATE TABLE forecast_log (id INTEGER PRIMARY KEY, user_id INTEGER, made_on TEXT, target_month TEXT,"
                 " forecast_paise INTEGER, actual_paise INTEGER)")
    init_db(conn)
    assert "entry_hash" in [r["name"] for r in conn.execute("PRAGMA table_info(forecast_log)")]


# ---------- backtest ----------

def test_backtest_judges_every_month_with_three_months_before_it(logged):
    t = logged.get("/api/track-record").json()
    assert [m["month"] for m in t["months"]] == MONTHS and all(m["source"] == "backtest" for m in t["months"])
    skipped = backtest(logged)["skipped"]
    assert [s["month"] for s in skipped] == ["2026-02", "2026-03", "2026-04"] + MONTHS
    assert all("at least 3 complete months" in s["reason"] for s in skipped[:3])
    assert all(s["reason"] == "Already in the log." for s in skipped[3:])


def test_backtest_twice_adds_nothing(logged):
    before = verify(logged)["headHash"]
    assert backtest(logged)["added"] == [] and verify(logged)["headHash"] == before


def test_forecast_band_is_ordered_and_actuals_match_the_trends_page(logged):
    months = {m["month"]: m for m in logged.get("/api/track-record").json()["months"]}
    surplus = {m["month"]: m["surplusPaise"] - m["oneOffPaise"] for m in logged.get("/api/trends").json()["months"]}
    for month, m in months.items():
        assert m["worstPaise"] <= m["typicalPaise"] <= m["bestPaise"]
        if month in surplus:                                          # the trends page shows the last 6 months
            assert m["actualPaise"] == surplus[month]
    assert months["2026-06"]["actualPaise"] < 0                       # the Rs 82,000 purchase month


def test_backtest_cannot_see_the_future(complete, db_path):
    conn = connect(db_path)
    forecast = lambda m: monthly_surplus_forecast(build_inputs(conn, 1, until=month_end(add_months(m, -1)).isoformat()), m)
    before = {m: forecast(m) for m in ("2026-05", "2026-06", "2026-07")}
    sql(db_path, "UPDATE transactions SET amount_paise = amount_paise * 7 WHERE txn_date >= '2026-06-01'")   # rewrite June onward
    after = {m: forecast(m) for m in before}
    assert after["2026-05"] == before["2026-05"] and after["2026-06"] == before["2026-06"]   # only data up to May was used
    assert after["2026-07"] != before["2026-07"]                                             # July does use June


def test_recurring_payments_are_found_from_earlier_data_only(complete, db_path):
    conn = connect(db_path)
    merchants = lambda until: {r["merchant"]: r["occurrences"] for r in build_inputs(conn, 1, until=until).recurring}
    assert "NETFLIX.COM" not in merchants("2026-03-31")              # only 2 payments seen so far
    assert merchants("2026-04-30")["NETFLIX.COM"] == 3
    assert merchants("2026-09-30")["NETFLIX.COM"] == 8
    assert all(i["last_seen"] <= "2026-03-31" for i in build_inputs(conn, 1, until="2026-03-31").recurring)


def test_backtest_skips_months_hit_by_a_gap(client):
    client.post("/api/demo-data?set=eight_months")
    r = backtest(client)
    assert [a["month"] for a in r["added"]] == ["2026-05", "2026-06", "2026-07"]
    skipped = {s["month"]: s["reason"] for s in r["skipped"]}
    assert "gap in this month" in skipped["2026-08"]
    assert "no data between" in skipped["2026-09"]                    # September's training data contains the gap


def test_backtest_needs_enough_history(client):
    client.post("/api/demo-data?set=short_2mo")
    r = backtest(client)
    assert r["added"] == [] and len(r["skipped"]) == 2


# ---------- track record ----------

def test_summary_is_the_arithmetic_of_the_months(logged):
    t = logged.get("/api/track-record").json()
    ms, s = t["months"], t["summary"]
    assert t["judgedMonths"] == 5 and t["enoughToJudge"] is True
    assert s["hitRate"] == round(sum(m["hit"] for m in ms) / 5, 3)
    assert s["worstCaseHeldRate"] == round(sum(m["actualPaise"] >= m["worstPaise"] for m in ms) / 5, 3)
    assert s["averageMissPaise"] == round(mean(abs(m["actualPaise"] - m["typicalPaise"]) for m in ms))
    assert s["biasPaise"] == round(mean(m["actualPaise"] - m["typicalPaise"] for m in ms))
    assert all(m["missPaise"] == m["actualPaise"] - m["typicalPaise"] for m in ms)
    assert t["chain"] == {"valid": True, "entries": 10} and "hitRate" in t["meaning"]


def test_judge_boundaries():
    f = {"target_month": "2026-05", "source": "live", "worst_paise": 100, "typical_paise": 200, "best_paise": 300}
    assert judge(f, {"actual_paise": 100})["hit"] and judge(f, {"actual_paise": 300})["hit"]       # edges count
    low, high = judge(f, {"actual_paise": 99}), judge(f, {"actual_paise": 301})
    assert not low["hit"] and not low["worstCaseHeld"] and not high["hit"] and high["worstCaseHeld"]
    assert judge(f, {"actual_paise": 150})["missPaise"] == -50


def test_tampering_shows_up_in_the_track_record(logged, db_path):
    sql(db_path, "UPDATE forecast_log SET actual_paise = 0 WHERE kind = 'actual'")
    assert logged.get("/api/track-record").json()["chain"]["valid"] is False


def test_empty_track_record(client):
    t = client.get("/api/track-record").json()
    assert t["summary"] is None and t["months"] == [] and t["enoughToJudge"] is False


# ---------- live forecasts ----------

def oct_statement(client, last_balance):
    """An October HDFC statement that continues from the last balance: rent out on the 1st, salary in on the 28th."""
    rows = [("01/10/2026", "UPI/RENT/MR SHARMA LANDLORD", 2_800_000, 0, last_balance - 2_800_000),
            ("28/10/2026", "NEFT CR-ACME TECH PVT LTD-SALARY", 0, 9_500_000, last_balance - 2_800_000 + 9_500_000)]
    money = lambda p: f"{p // 100}.{p % 100:02d}" if p else ""
    body = "".join(f"{d},{t},{money(w)},{money(c)},{money(b)}\n" for d, t, w, c, b in rows)
    return ("Account No,50100123451234\nDate,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n" + body).encode()


def test_live_forecast_then_settle_when_the_month_arrives(complete, db_path):
    r = complete.post("/api/track-record/forecast").json()
    expected = monthly_surplus_forecast(build_inputs(connect(db_path), 1), "2026-10")
    assert r["status"] == "logged" and r["targetMonth"] == "2026-10" and r["forecast"] == expected
    assert complete.post("/api/track-record/forecast").json()["status"] == "already_logged"
    assert complete.post("/api/track-record/settle").json() == {"settled": [], "stillWaiting": ["2026-10"]}

    last = complete.get("/api/transactions", params={"account": 1, "limit": 1}).json()["transactions"][0]["balancePaise"]
    assert complete.post("/api/upload", files={"file": ("oct.csv", oct_statement(complete, last))}).status_code == 200
    settled = complete.post("/api/track-record/settle").json()["settled"]
    assert settled == [{"month": "2026-10", "actualPaise": 6_700_000}]       # 95,000 in - 28,000 out
    t = complete.get("/api/track-record").json()
    assert [(m["month"], m["source"]) for m in t["months"]] == [("2026-10", "live")] and verify(complete)["valid"]


def test_live_forecast_refuses_without_enough_data(client):
    client.post("/api/demo-data?set=short_2mo")
    r = client.post("/api/track-record/forecast").json()
    assert r["status"] == "insufficient_data" and [m["code"] for m in r["missing"]] == ["HISTORY"]
    assert client.get("/api/forecast-log").json()["entries"] == []


# ---------- categorisation accuracy ----------

def test_every_demo_row_has_a_planted_label(complete):
    report = complete.get("/api/categorisation-accuracy").json()
    assert report["labelled"] == complete.get("/api/transactions", params={"limit": 1}).json()["total"]
    assert len(load_labels()) >= report["labelled"]


def test_before_accuracy_is_wrong_exactly_on_the_hard_merchants(complete, db_path):
    rows = labelled_rows(connect(db_path), 1, load_labels())
    groups = wrong_groups(rows)
    assert {m for m, _ in groups} == {"BLINKIT", "ZEPTO", "MAKEMYTRIP", "IRCTC", "MYNTRA"}
    assert {r["category"] for g in groups.values() for r in g} == {"Other"}
    assert sum(len(g) for g in groups.values()) == 15
    r = complete.get("/api/categorisation-accuracy").json()
    assert r["before"] == {"correct": r["labelled"] - 15, "total": r["labelled"], "accuracy": round((r["labelled"] - 15) / r["labelled"], 4)}


def test_after_corrections_accuracy_rises_to_100_in_five_merchant_fixes(complete):
    r = complete.get("/api/categorisation-accuracy").json()
    assert r["after"]["accuracy"] == 1.0 and r["correctionsNeeded"] == 5 and r["stillWrong"] == []
    accuracies = [s["accuracy"] for s in r["steps"]]
    assert accuracies == sorted(accuracies) and accuracies[-1] == 1.0 and accuracies[0] > r["before"]["accuracy"]
    assert sum(s["rowsFixed"] for s in r["steps"]) == 15
    assert r["steps"][0]["rowsFixed"] == max(s["rowsFixed"] for s in r["steps"])        # biggest mistake first


def test_the_simulation_never_touches_the_real_data(complete, db_path):
    snapshot = lambda: sqlite3.connect(db_path).execute("SELECT id, category_id FROM transactions ORDER BY id").fetchall()
    before = snapshot()
    complete.get("/api/categorisation-accuracy")
    assert snapshot() == before
    assert sqlite3.connect(db_path).execute("SELECT COUNT(*) FROM corrections").fetchone()[0] == 0


def test_a_real_correction_shows_up_in_the_before_figure(complete):
    first = complete.get("/api/categorisation-accuracy").json()["before"]["correct"]
    blinkit = complete.get("/api/transactions", params={"q": "BLINKIT"}).json()["transactions"][0]
    groceries = next(c["id"] for c in complete.get("/api/categories").json() if c["name"] == "Groceries")
    assert len(complete.post(f"/api/transactions/{blinkit['id']}/category", json={"categoryId": groceries}).json()["changed"]) == 4
    r = complete.get("/api/categorisation-accuracy").json()
    assert r["before"]["correct"] == first + 4 and r["correctionsNeeded"] == 4


def test_a_merchant_with_two_true_categories_is_not_auto_fixed():
    rows = [{"id": 1, "merchant": "M", "category": "Other", "truth": "Food & Dining"},
            {"id": 2, "merchant": "M", "category": "Other", "truth": "Groceries"},
            {"id": 3, "merchant": "N", "category": "Other", "truth": "Fuel"}]
    assert list(wrong_groups(rows)) == [("N", "Fuel")]
    assert score(rows) == {"correct": 0, "total": 3, "accuracy": 0.0} and score([]) == {"correct": 0, "total": 0, "accuracy": None}


def test_accuracy_without_labels_says_so(client):
    csv = (b"Account No,50100123451234\nDate,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n"
           b"01/02/2026,UPI/RENT/X,28000.00,,122000.00\n")
    client.post("/api/upload", files={"file": ("a.csv", csv)})
    r = client.get("/api/categorisation-accuracy").json()
    assert r["labelled"] == 0 and "planted label" in r["message"]


def test_the_short_dataset_is_fully_labelled_and_already_correct(client):
    client.post("/api/demo-data?set=short_2mo")
    r = client.get("/api/categorisation-accuracy").json()
    assert r["before"]["accuracy"] == 1.0 and r["correctionsNeeded"] == 0
