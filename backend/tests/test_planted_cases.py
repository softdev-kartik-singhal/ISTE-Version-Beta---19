"""One test per planted case in demo_data/README.md, each through the public API as a signed-in user.

The first eight are the cases the team has to defend; the rest cover the remaining planted cases.
"""

"""One test per planted case in demo_data/README.md, each through the public API as a signed-in user.

The first eight are the cases the team has to defend; the rest cover the remaining planted cases.
"""
import sqlite3
from collections import Counter

from tests.test_phase7 import verify_both, register_card

AMAZON = "UPI/AMAZON PAY/ORD-402-"


def transactions(client, **params):
    return client.get("/api/transactions", params={"limit": 500, **params}).json()["transactions"]


def ask(client, amount=8_000_000, month="2026-10"):
    return client.post("/api/ask", json={"amountPaise": amount, "targetMonth": month}).json()


def table_snapshot(db_path, tables=("accounts", "uploaded_files", "transactions", "recurring", "categories")):
    db = sqlite3.connect(db_path)
    return {t: db.execute(f"SELECT * FROM {t} ORDER BY 1").fetchall() for t in tables}


# ---------- 1. overlapping exports ----------

def test_case_1_overlapping_exports_are_removed(client):
    """bank_a_feb_jul and bank_a_jul_sep both contain 10-31 Jul. Each row must be stored once."""
    files = {f["file"]: f for f in client.post("/api/demo-data?set=eight_months").json()["files"]}
    assert files["bank_a_feb_jul.csv"]["duplicateRows"] == 0
    assert files["bank_a_jul_sep.csv"]["duplicateRows"] == 5 and files["bank_a_jul_sep.csv"]["newRows"] == 16
    hdfc = [t for t in transactions(client) if t["bank"] == "HDFC"]
    assert len(hdfc) == files["bank_a_feb_jul.csv"]["rows"] + files["bank_a_jul_sep.csv"]["newRows"]
    keys = Counter((t["date"], t["amountPaise"], t["description"], t["balancePaise"]) for t in hdfc)
    assert max(keys.values()) == 1                                           # no row twice
    assert client.get("/api/statements").json()["merge"]["duplicatesSkipped"] == 5


# ---------- 2. own-account transfer ----------

def test_case_2_own_account_transfers_are_excluded(complete):
    """Rs 20,000 leaves HDFC and arrives in Kotak every month. It is neither spending nor income."""
    transfers = transactions(complete, kind="transfer")
    assert len(transfers) == 16 and {t["category"] for t in transfers} == {"Transfer"}
    assert sorted(t["amountPaise"] for t in transfers) == [-2_000_000] * 8 + [2_000_000] * 8
    assert {t["bank"] for t in transfers} == {"HDFC", "Kotak"}
    normal = [t for t in transactions(complete) if t["kind"] == "normal"]
    summary = complete.get("/api/transactions").json()["summary"]
    assert summary["inflowPaise"] == sum(t["amountPaise"] for t in normal if t["amountPaise"] > 0)
    assert summary["outflowPaise"] == -sum(t["amountPaise"] for t in normal if t["amountPaise"] < 0)
    sep = complete.get("/api/dashboard").json()["latestMonth"]
    assert sep["inflowPaise"] == sum(t["amountPaise"] for t in normal if t["amountPaise"] > 0 and t["date"].startswith("2026-09"))
    assert not any("TRANSFER" in n["name"].upper() for n in complete.get("/api/money-flow").json()["nodes"])
    assert {c["name"]: c["totalPaise"] for c in complete.get("/api/categories").json()}["Transfer"] == 0


# ---------- 3. genuine second payment ----------

def test_case_3_genuine_second_payment_is_kept_and_not_flagged(complete):
    """Two Amazon payments of Rs 2,499 on 9 Jul with different order refs and different balances."""
    rows = [t for t in transactions(complete) if t["description"].startswith(AMAZON)]
    assert len(rows) == 2 and {t["date"] for t in rows} == {"2026-07-09"} and {t["amountPaise"] for t in rows} == {-249_900}
    assert len({t["description"] for t in rows}) == 2 and len({t["balancePaise"] for t in rows}) == 2
    assert {t["kind"] for t in rows} == {"normal"}
    flags = complete.get("/api/flags").json()
    assert not any("ORD-402" in f["reason"] or f["merchant"] == "AMAZON PAY" and f["type"] == "duplicate"
                   for f in flags["flags"] + flags["resolved"])


# ---------- 4. real duplicate charge ----------

def test_case_4_duplicate_charge_is_flagged_and_both_rows_kept(complete):
    """Swiggy Instamart ORD-SIM98231 Rs 1,499 charged twice on 18 May: the bank took the money twice."""
    rows = [t for t in transactions(complete) if "ORD-SIM98231" in t["description"]]
    assert len(rows) == 2 and len({t["balancePaise"] for t in rows}) == 2          # kept, with different balances
    dups = [f for f in complete.get("/api/flags").json()["flags"] if f["type"] == "duplicate"]
    assert len(dups) == 1 and dups[0]["date"] == "2026-05-18" and "ORD-SIM98231" in dups[0]["reason"]
    before = complete.get("/api/transactions").json()["summary"]["outflowPaise"]
    complete.post(f"/api/flags/{dups[0]['id']}/decision", json={"decision": "confirmed"})
    assert complete.get("/api/transactions").json()["summary"]["outflowPaise"] == before - 149_900     # the double charge stops counting


# ---------- 5. bonus ----------

def test_case_5_bonus_is_excluded_from_the_forecast(complete):
    """A Rs 1,20,000 bonus on 14 Feb that never repeats must not lift the income forecast."""
    answer = ask(complete)
    assert [o["paise"] for o in answer["income"]["oneOff"]] == [12_000_000]
    feb = complete.get("/api/transactions", params={"date_from": "2026-02-01", "date_to": "2026-02-28"}).json()["summary"]
    assert answer["income"]["monthlyPaise"]["2026-02"] == feb["inflowPaise"] - 12_000_000
    assert max(answer["income"]["monthlyPaise"].values()) < 12_000_000 + 9_500_000
    assert answer["bonusScenario"]["oneOff"]["paise"] == 12_000_000                 # shown separately, not baked into the cases
    assert answer["bonusScenario"]["cases"]["typical"]["headroomPaise"] - answer["cases"]["typical"]["headroomPaise"] == 12_000_000


# ---------- 6. two-month dataset ----------

def test_case_6_two_month_dataset_is_refused(client):
    """Two months of statements are not enough to forecast anything."""
    client.post("/api/demo-data?set=short_2mo")
    refusal = ask(client)
    assert refusal["status"] == "insufficient_data" and [m["code"] for m in refusal["missing"]] == ["HISTORY"]
    assert "found 2" in refusal["missing"][0]["message"]
    what_if = client.post("/api/what-if", json={"amountPaise": 8_000_000, "targetMonth": "2026-10"}).json()
    assert what_if["status"] == "insufficient_data"
    assert client.post("/api/track-record/forecast").json()["status"] == "insufficient_data"
    assert client.post("/api/track-record/backtest").json()["added"] == []
    assert client.get("/api/trends").json()["insufficientHistory"] is True


# ---------- 7. re-upload ----------

def test_case_7_uploading_everything_again_changes_nothing(client, db_path):
    """The same files a second time: refused, and the database is byte-for-byte the same."""
    client.post("/api/demo-data?set=eight_months")
    before = table_snapshot(db_path)
    again = client.post("/api/demo-data?set=eight_months").json()["files"]
    assert {f["status"] for f in again} == {"already uploaded"}
    for name in ("bank_a_feb_jul.csv", "bank_a_jul_sep.csv", "bank_b_feb_sep.csv"):
        data = open(f"demo_data/eight_months/{name}", "rb").read()
        r = client.post("/api/upload", files={"file": (name, data)})
        assert r.status_code == 409 and "already" in r.json()["detail"]["reason"]
    assert table_snapshot(db_path) == before


# ---------- 8. chain tamper ----------

def test_case_8_tampering_with_the_forecast_log_is_detected(complete, db_path):
    """Change one past forecast: verification must name the first broken entry."""
    complete.post("/api/track-record/backtest")
    assert complete.get("/api/forecast-log/verify").json()["valid"] is True
    db = sqlite3.connect(db_path)
    target = db.execute("SELECT id, target_month FROM forecast_log WHERE kind = 'forecast' AND target_month = '2026-07'").fetchone()
    db.execute("UPDATE forecast_log SET worst_paise = worst_paise + 1000000 WHERE id = ?", (target[0],))     # make a miss look like a hit
    db.commit()
    result = complete.get("/api/forecast-log/verify").json()
    assert result["valid"] is False and result["firstBrokenLink"]["entryId"] == target[0]
    assert result["firstBrokenLink"]["targetMonth"] == "2026-07" and "Content changed" in result["firstBrokenLink"]["reason"]
    assert complete.get("/api/track-record").json()["chain"]["valid"] is False


# ---------- 9. irregular freelance income ----------

def test_case_9_irregular_freelance_income_keeps_the_forecast_cautious(complete):
    """Freelance pays at random; March and June have none. The worst case must count salary only."""
    income = ask(complete)["income"]
    (freelance,) = income["irregular"]
    assert freelance["merchant"] == "FREELANCE CLIENT" and freelance["occurrences"] == 8
    assert income["monthlyPaise"]["2026-03"] == income["monthlyPaise"]["2026-06"] == 9_500_000       # salary only
    assert len({m for m in income["monthlyPaise"].values()}) > 3                                       # and the other months vary
    assert ask(complete)["cases"]["worst"]["incomePaise"] == 9_500_000


# ---------- 10. subscriptions, EMI, rent ----------

def test_case_10_subscriptions_emi_and_rent_are_recurring(complete):
    items = {i["merchant"]: i for i in complete.get("/api/recurring").json()["items"]}
    assert {m: (i["label"], i["typicalPaise"], i["cadenceDays"]) for m, i in items.items()} == {
        "RENT": ("rent", -2_800_000, 30), "HDFC LTD-EMI": ("emi", -1_450_000, 30),
        "SPOTIFY INDIA": ("subscription", -11_900, 30), "NETFLIX.COM": ("subscription", -64_900, 30),
        "APPLE ICLOUD": ("subscription", -7_500, 30), "ACME TECH PVT LTD-SALARY": ("salary", 9_500_000, 30)}
    committed = {c["merchant"] for c in ask(complete)["committed"]}
    assert committed == {"RENT", "HDFC LTD-EMI", "SPOTIFY INDIA", "NETFLIX.COM", "APPLE ICLOUD"}   # salary is income, not a cost


# ---------- 11. large purchase ----------

def test_case_11_large_purchase_is_flagged_and_kept_out_of_normal_spending(complete):
    flag = next(f for f in complete.get("/api/flags").json()["flags"] if f["type"] == "large")
    assert flag["merchant"] == "CROMA ELECTRONICS BLR" and flag["amountPaise"] == 8_200_000 and "32.8x" in flag["reason"]
    assert all(v["high"] < 8_200_000 for v in ask(complete)["variableByCategory"].values())         # not in Jul-Sep variable spend


# ---------- 12. new merchant ----------

def test_case_12_new_merchant_is_flagged(complete):
    flag = next(f for f in complete.get("/api/flags").json()["flags"]
                if f["type"] == "new-merchant" and f["merchant"] == "STRIPE CURSOR AI")
    assert flag["date"] == "2026-09-14" and flag["amountPaise"] == 172_000
    assert complete.get("/api/money-flow", params={"month": "2026-09", "category": "Subscriptions"}).json()["selectedCategory"]["newMerchants"] == ["STRIPE CURSOR AI"]


# ---------- 13. ten-day gap ----------

def test_case_13_ten_day_gap_is_reported_and_blocks_the_forecast(client):
    client.post("/api/demo-data?set=eight_months")
    accounts = {a["bank"]: a for a in client.get("/api/statements").json()["coverage"]["accounts"]}
    assert accounts["HDFC"]["gaps"] == []
    (gap,) = accounts["Kotak"]["gaps"]
    assert gap["from"] < "2026-08-11" and gap["to"] > "2026-08-20" and gap["days"] >= 10
    refusal = ask(client)
    assert refusal["status"] == "insufficient_data" and [m["code"] for m in refusal["missing"]] == ["GAP"]
    assert "Kotak ••5678" in refusal["missing"][0]["message"]


# ---------- 14. hard-to-categorise merchants ----------

def test_case_14_hard_merchants_start_in_other_and_one_correction_each_fixes_them(complete):
    rows = {t["merchant"]: t["category"] for t in transactions(complete)
            if t["merchant"] in ("BLINKIT", "ZEPTO", "MAKEMYTRIP", "IRCTC", "MYNTRA")}
    assert set(rows.values()) == {"Other"}                                          # the keyword rules do not know them
    report = complete.get("/api/categorisation-accuracy").json()
    assert report["before"]["total"] - report["before"]["correct"] == 15
    assert report["correctionsNeeded"] == 5 and report["after"]["accuracy"] == 1.0
