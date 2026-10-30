"""Phase 3 tests: merchants, categories, corrections + undo, recurring, flags + decisions."""
import pytest

from app.services.flags import duplicate_flags, large_flags, new_merchant_flags
from app.services.merchant import merchant_of, ref_of
from app.services.recurring import cadence_of, detect
from datetime import date, timedelta


# ---------- merchant / reference ----------

@pytest.mark.parametrize("desc,merchant", [
    ("UPI/SWIGGY/9285415473", "SWIGGY"),
    ("UPI/SWIGGY INSTAMART/ORD-SIM98231", "SWIGGY INSTAMART"),
    ("POS CROMA ELECTRONICS BLR", "CROMA ELECTRONICS BLR"),
    ("IMPS CR-FREELANCE CLIENT 3", "FREELANCE CLIENT"),
    ("ACH D-HDFC LTD-EMI-LN00482", "HDFC LTD-EMI"),
    ("NETFLIX.COM", "NETFLIX.COM"),
])
def test_merchant_of(desc, merchant):
    assert merchant_of(desc) == merchant


def test_ref_of():
    assert ref_of("UPI/AMAZON PAY/ORD-402-1111") == "ORD-402-1111"
    assert ref_of("UPI/RENT/MR SHARMA LANDLORD") is None   # a name, not a code
    assert ref_of("NETFLIX.COM") is None


# ---------- helpers ----------

@pytest.fixture
def demo(client):
    client.post("/api/demo-data")
    return client


def txns(client, **params):
    return client.get("/api/transactions", params={"limit": 500, **params}).json()["transactions"]


def cat_id(client, name):
    return next(c["id"] for c in client.get("/api/categories").json() if c["name"] == name)


# ---------- categorisation ----------

def test_rules_categorise_demo_rows(demo):
    by_desc = {t["description"]: t["category"] for t in txns(demo)}
    assert by_desc["NETFLIX.COM"] == "Subscriptions"
    assert by_desc["UPI/SWIGGY INSTAMART/ORD-SIM98231"] == "Groceries"   # INSTAMART outranks SWIGGY
    assert by_desc["NEFT CR-ACME TECH PVT LTD-ANNUAL BONUS FY25"] == "Bonus"
    assert by_desc["ACH D-HDFC LTD-EMI-LN00482"] == "EMI"
    assert by_desc["POS CROMA ELECTRONICS BLR"] == "Shopping"


def test_transfers_get_transfer_category_and_no_row_is_uncategorised(demo):
    rows = txns(demo)
    assert all(t["category"] for t in rows)
    assert {t["category"] for t in rows if t["kind"] == "transfer"} == {"Transfer"}


# ---------- corrections ----------

def test_correction_applies_to_whole_merchant_and_lists_changed_rows(demo):
    swiggy = [t for t in txns(demo) if t["merchant"] == "SWIGGY"]
    r = demo.post(f"/api/transactions/{swiggy[0]['id']}/category", json={"categoryId": cat_id(demo, "Groceries")})
    body = r.json()
    assert r.status_code == 200 and len(body["changed"]) == len(swiggy)
    assert {c["from"] for c in body["changed"]} == {"Food & Dining"} and {c["to"] for c in body["changed"]} == {"Groceries"}
    assert all(t["category"] == "Groceries" for t in txns(demo) if t["merchant"] == "SWIGGY")


def test_correction_single_row_only(demo):
    swiggy = [t for t in txns(demo) if t["merchant"] == "SWIGGY"]
    body = demo.post(f"/api/transactions/{swiggy[0]['id']}/category",
                     json={"categoryId": cat_id(demo, "Shopping"), "applyToMerchant": False}).json()
    assert [c["id"] for c in body["changed"]] == [swiggy[0]["id"]]


def test_undo_restores_every_row_and_cannot_repeat(demo):
    before = {t["id"]: t["category"] for t in txns(demo)}
    swiggy_id = next(t["id"] for t in txns(demo) if t["merchant"] == "SWIGGY")
    batch = demo.post(f"/api/transactions/{swiggy_id}/category", json={"categoryId": cat_id(demo, "Groceries")}).json()["batchId"]
    undo = demo.post(f"/api/corrections/{batch}/undo")
    assert undo.status_code == 200 and len(undo.json()["restored"]) > 1
    assert {t["id"]: t["category"] for t in txns(demo)} == before
    assert demo.post(f"/api/corrections/{batch}/undo").status_code == 404


def test_correction_unknown_ids_404(demo):
    assert demo.post("/api/transactions/999999/category", json={"categoryId": 1}).status_code == 404
    first = txns(demo)[0]["id"]
    assert demo.post(f"/api/transactions/{first}/category", json={"categoryId": 9999}).status_code == 404


def test_correction_is_remembered_for_future_uploads_until_undone(demo):
    zomato = next(t["id"] for t in txns(demo) if t["merchant"] == "ZOMATO")
    batch = demo.post(f"/api/transactions/{zomato}/category", json={"categoryId": cat_id(demo, "Groceries")}).json()["batchId"]
    csv = (b"Account No,50100123451234\nDate,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n"
           b"05/10/2026,UPI/ZOMATO/1111111111,500.00,,100.00\n")
    demo.post("/api/upload", files={"file": ("new.csv", csv)})
    assert next(t for t in txns(demo, q="1111111111"))["category"] == "Groceries"
    demo.post(f"/api/corrections/{batch}/undo")
    csv2 = csv.replace(b"1111111111", b"2222222222").replace(b"05/10", b"06/10")
    demo.post("/api/upload", files={"file": ("new2.csv", csv2)})
    assert next(t for t in txns(demo, q="2222222222"))["category"] == "Food & Dining"


# ---------- recurring ----------

def test_demo_recurring_items(demo):
    items = {i["merchant"]: i for i in demo.get("/api/recurring").json()["items"]}
    assert set(items) == {"RENT", "SPOTIFY INDIA", "NETFLIX.COM", "APPLE ICLOUD", "HDFC LTD-EMI", "ACME TECH PVT LTD-SALARY"}
    assert items["HDFC LTD-EMI"]["typicalPaise"] == -1_450_000 and items["HDFC LTD-EMI"]["cadenceDays"] == 30
    assert items["ACME TECH PVT LTD-SALARY"]["label"] == "salary"
    assert items["NETFLIX.COM"]["nextExpected"] == "2026-10-12"


def rec(i, day, amount, merchant="X"):
    return {"id": i, "merchant": merchant, "txn_date": day.isoformat(), "amount_paise": amount, "category": "Other"}


def series(start, gap, amounts):
    return [rec(i, start + timedelta(days=gap * i), a) for i, a in enumerate(amounts)]


def test_detect_needs_three_occurrences():
    assert detect(series(date(2026, 1, 1), 30, [-1000, -1000])) == []
    assert len(detect(series(date(2026, 1, 1), 30, [-1000] * 3))) == 1


def test_detect_amount_tolerance():
    assert len(detect(series(date(2026, 1, 1), 30, [-1000, -1040, -960]))) == 1   # within +/-5%
    assert detect(series(date(2026, 1, 1), 30, [-1000, -1500, -2000])) == []


@pytest.mark.parametrize("gap,expected", [(7, 7), (30, 30), (365, 365), (15, None), (90, None)])
def test_cadence(gap, expected):
    days = [date(2024, 1, 1) + timedelta(days=gap * i) for i in range(4)]
    assert cadence_of(days) == expected


def test_one_missed_month_still_recurring():
    days = [date(2026, 1, 12), date(2026, 2, 12), date(2026, 3, 12), date(2026, 5, 12), date(2026, 6, 12), date(2026, 7, 12)]
    assert cadence_of(days) == 30


def test_income_and_spend_with_same_merchant_are_separate():
    rows = series(date(2026, 1, 1), 30, [-500] * 3) + [rec(10 + i, date(2026, 1, 5) + timedelta(days=i), 500) for i in range(2)]
    (item,) = detect(rows)
    assert item["typical_paise"] == -500


# ---------- flags ----------

def test_demo_flags_exactly_the_planted_ones(demo):
    flags = demo.get("/api/flags").json()["flags"]
    kinds = sorted(f["type"] for f in flags)
    assert kinds.count("large") == 1 and kinds.count("duplicate") == 1
    large = next(f for f in flags if f["type"] == "large")
    assert large["merchant"] == "CROMA ELECTRONICS BLR" and "32.8x" in large["reason"]
    dup = next(f for f in flags if f["type"] == "duplicate")
    assert dup["date"] == "2026-05-18" and "ORD-SIM98231" in dup["reason"]
    new = {f["merchant"] for f in flags if f["type"] == "new-merchant"}
    assert "STRIPE CURSOR AI" in new
    assert not any("ORD-402" in f["reason"] for f in flags)       # genuine second payment: no duplicate flag


def test_decision_is_remembered_and_confirmed_duplicate_leaves_spending(demo):
    dup = next(f for f in demo.get("/api/flags").json()["flags"] if f["type"] == "duplicate")
    before = demo.get("/api/transactions").json()["summary"]["outflowPaise"]
    assert demo.post(f"/api/flags/{dup['id']}/decision", json={"decision": "confirmed"}).status_code == 200
    after = demo.get("/api/flags").json()
    assert dup["id"] not in [f["id"] for f in after["flags"]]
    assert next(f for f in after["resolved"] if f["id"] == dup["id"])["decision"] == "confirmed"
    assert demo.get("/api/transactions").json()["summary"]["outflowPaise"] == before - dup["amountPaise"]
    # re-uploading nothing new does not bring it back; undoing does
    assert demo.delete(f"/api/flags/{dup['id']}/decision").status_code == 200
    assert dup["id"] in [f["id"] for f in demo.get("/api/flags").json()["flags"]]
    assert demo.get("/api/transactions").json()["summary"]["outflowPaise"] == before


def test_dismissed_large_flag_stays_dismissed(demo):
    big = next(f for f in demo.get("/api/flags").json()["flags"] if f["type"] == "large")
    demo.post(f"/api/flags/{big['id']}/decision", json={"decision": "dismissed"})
    assert big["id"] not in [f["id"] for f in demo.get("/api/flags").json()["flags"]]


def test_bad_flag_decisions_404(demo):
    assert demo.post("/api/flags/large-1/decision", json={"decision": "confirmed"}).status_code == 404
    big = next(f for f in demo.get("/api/flags").json()["flags"] if f["type"] == "large")
    assert demo.post(f"/api/flags/{big['id']}/decision", json={"decision": "maybe"}).status_code == 404
    assert demo.delete("/api/flags/large-1/decision").status_code == 404


def frow(i, day, amount, desc, merchant, category="Shopping", kind="normal"):
    return {"id": i, "txn_date": day, "amount_paise": amount, "description": desc, "merchant": merchant,
            "kind": kind, "category": category, "bank": "HDFC", "last4": "1234"}


def test_duplicate_without_any_reference_falls_back_to_merchant_and_amount():
    rows = [frow(1, "2026-03-01", -64900, "NETFLIX.COM", "NETFLIX.COM"), frow(2, "2026-03-02", -64900, "NETFLIX.COM", "NETFLIX.COM")]
    assert len(duplicate_flags(rows)) == 1


def test_duplicate_window_and_reference_rules():
    far = [frow(1, "2026-03-01", -5000, "UPI/A/REF-0001", "A"), frow(2, "2026-03-04", -5000, "UPI/A/REF-0001", "A")]
    different = [frow(1, "2026-03-01", -5000, "UPI/A/REF-0001", "A"), frow(2, "2026-03-01", -5000, "UPI/A/REF-0002", "A")]
    assert duplicate_flags(far) == [] and duplicate_flags(different) == []


def test_large_needs_history_and_minimum_size():
    few = [frow(1, "2026-03-01", -10_000_00, "x", "A"), frow(2, "2026-03-02", -100_00, "y", "B")]
    assert large_flags(few) == []                                    # only 1 other purchase: no baseline
    small = [frow(i, "2026-03-01", -100 * (1 if i < 4 else 20), "x", "A") for i in range(1, 5)]
    assert large_flags(small) == []                                  # 20x but under Rs 2,000


def test_new_merchant_ignored_during_warmup():
    rows = [frow(1, "2026-01-01", -100_00, "UPI/A/123456", "A"), frow(2, "2026-01-20", -90_000, "UPI/B/123456", "B"),
            frow(3, "2026-04-01", -90_000, "UPI/C/123456", "C")]
    assert [f["merchant"] for f in new_merchant_flags(rows)] == ["C"]


# ---------- transactions endpoint ----------

def test_transactions_filters_and_summary_exclude_transfers(demo):
    r = demo.get("/api/transactions", params={"q": "netflix"}).json()
    assert r["total"] == 7 and all(t["merchant"] == "NETFLIX.COM" for t in r["transactions"])
    allr = demo.get("/api/transactions", params={"limit": 1}).json()
    transfers = sum(t["amountPaise"] for t in txns(demo, kind="transfer") if t["amountPaise"] > 0)
    assert transfers == 16_000_000 and allr["summary"]["inflowPaise"] > 0
    assert allr["transactions"][0]["date"] == max(t["date"] for t in txns(demo))   # newest first
    in_gap = demo.get("/api/transactions", params={"date_from": "2026-08-11", "date_to": "2026-08-20", "account": 2}).json()
    assert in_gap["total"] == 0
    assert demo.get("/api/transactions", params={"date_from": "2026-08-01", "date_to": "2026-08-10", "account": 2}).json()["total"] > 0


def test_categories_totals(demo):
    cats = {c["name"]: c for c in demo.get("/api/categories").json()}
    assert cats["Rent"]["totalPaise"] == 8 * 2_800_000 and cats["Transfer"]["totalPaise"] == 0
