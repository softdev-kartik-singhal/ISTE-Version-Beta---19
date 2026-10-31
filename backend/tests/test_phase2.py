"""Phase 2 tests: parsing, rejection, dedupe, transfer matching, and the three endpoints."""
import pytest

from app.services.parser import StatementRejected, mask_account, parse_pdf, parse_statement, to_paise
from app.services.transfers import candidate_edges, pick_matches
from tests.make_pdf import make_pdf

HDFC_CSV = (b"Account No,50100123451234\nDate,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n"
            b"01/02/2026,UPI/RENT/X,28000.00,,122000.00\n28/02/2026,SALARY,,95000.50,217000.50\n")
PDF_LINES = ["HDFC BANK Account Statement", "Account No: 50100123451234", "Opening Balance 150000.00",
             "01/02/2026 UPI/RENT/MR SHARMA 28000.00 122000.00", "28/02/2026 SALARY ACME 95000.50 217000.50"]


# ---------- parsing ----------

def test_to_paise_is_exact():
    assert to_paise("1,234.50") == 123450 and to_paise("0.07") == 7 and to_paise("") is None


def test_mask_keeps_last_four_only():
    assert mask_account("50100123451234") == "1234"


def test_hdfc_csv_parses_signed_paise_and_masks_account():
    s = parse_statement("a.csv", HDFC_CSV)
    assert (s.bank, s.last4) == ("HDFC", "1234")
    assert [(r.txn_date, r.amount_paise, r.balance_paise) for r in s.rows] == [
        ("2026-02-01", -2800000, 12200000), ("2026-02-28", 9500050, 21700050)]


def test_kotak_csv_uses_dr_cr_marker():
    data = b"Account No,7312345678905678\nTransaction Date,Description,Amount,Dr/Cr,Balance\n2026-02-01,X,10.00,DR,90.00\n"
    s = parse_statement("b.csv", data)
    assert s.bank == "Kotak" and s.last4 == "5678" and s.rows[0].amount_paise == -1000


@pytest.mark.parametrize("name,data,reason", [
    ("a.csv", b"", "empty"),
    ("a.txt", b"hello", "Only CSV and PDF"),
    ("a.csv", b"Account No,1234\nfoo,bar\n1,2\n", "Unrecognised CSV format"),
    ("a.csv", b"Date,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n", "Account No"),
    ("a.csv", b"Account No,50100123451234\nDate,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n99/99/2026,X,1.00,,5.00\n",
     "Line 3"),
    ("a.csv", b"Account No,50100123451234\nDate,Narration,Withdrawal Amt,Deposit Amt,Closing Balance\n", "no transactions"),
])
def test_bad_files_are_rejected_with_a_reason(name, data, reason):
    with pytest.raises(StatementRejected, match=reason):
        parse_statement(name, data)


def test_pdf_parses_and_direction_comes_from_balance():
    s = parse_statement("s.pdf", make_pdf(PDF_LINES))
    assert (s.bank, s.last4) == ("HDFC", "1234")
    assert [r.amount_paise for r in s.rows] == [-2800000, 9500050]


def test_pdf_other_bank_rejected():
    with pytest.raises(StatementRejected, match="only HDFC"):
        parse_pdf(make_pdf(["ICICI Statement", "Account No: 1234"]))


def test_pdf_row_that_does_not_reconcile_rejected():
    lines = PDF_LINES[:3] + ["01/02/2026 UPI/RENT 28000.00 100000.00"]
    with pytest.raises(StatementRejected, match="reconcile"):
        parse_pdf(make_pdf(lines))


def test_corrupt_pdf_rejected():
    with pytest.raises(StatementRejected, match="PDF could not be opened"):
        parse_statement("s.pdf", b"%PDF-1.4 garbage")


# ---------- transfer matching ----------

def row(i, acct, day, amt):
    return {"id": i, "account_id": acct, "txn_date": f"2026-03-{day:02d}", "amount_paise": amt}


def test_transfer_needs_other_account_same_amount_and_two_days():
    rows = [row(1, 1, 3, -100), row(2, 2, 5, 100),   # 2 days apart -> match
            row(3, 1, 10, -200), row(4, 2, 13, 200),  # 3 days apart -> no
            row(5, 1, 20, -300), row(6, 1, 20, 300)]  # same account -> no
    assert pick_matches(candidate_edges(rows)) == [(1, 2)]


def test_each_row_matched_once_closest_date_wins():
    rows = [row(1, 1, 5, -100), row(2, 2, 5, 100), row(3, 2, 6, 100)]
    assert pick_matches(candidate_edges(rows)) == [(1, 2)]


# ---------- endpoints ----------

def test_upload_then_same_file_again_is_409(client):
    r = client.post("/api/upload", files={"file": ("a.csv", HDFC_CSV)})
    assert r.status_code == 200 and r.json()["newRows"] == 2
    again = client.post("/api/upload", files={"file": ("a.csv", HDFC_CSV)})
    assert again.status_code == 409 and "already" in again.json()["detail"]["reason"]


def test_upload_unknown_format_is_422_with_reason(client):
    r = client.post("/api/upload", files={"file": ("a.csv", b"x,y\n1,2\n")})
    assert r.status_code == 422 and "Unrecognised" in r.json()["detail"]["reason"]


def test_upload_pdf(client):
    r = client.post("/api/upload", files={"file": ("s.pdf", make_pdf(PDF_LINES))})
    assert r.status_code == 200 and r.json()["rows"] == 2


def test_raw_file_and_full_account_number_not_stored(client, db_path):
    client.post("/api/upload", files={"file": ("a.csv", HDFC_CSV)})
    import sqlite3
    dump = "\n".join(sqlite3.connect(db_path).iterdump())
    assert "50100123451234" not in dump


def test_demo_data_end_to_end(client):
    r = client.post("/api/demo-data")
    files = {f["file"]: f for f in r.json()["files"]}
    assert files["bank_a_jul_sep.csv"]["duplicateRows"] >= 3        # overlap skipped
    data = client.get("/api/statements").json()
    assert data["merge"]["transferPairs"] == 8                      # one 20,000 transfer a month
    assert data["merge"]["transferPaise"] == 8 * 2_000_000
    assert data["merge"]["accounts"] == 2
    by_bank = {a["bank"]: a for a in data["coverage"]["accounts"]}
    assert by_bank["HDFC"]["gaps"] == []
    (gap,) = by_bank["Kotak"]["gaps"]                               # the planted 10-day gap
    assert gap["from"] < "2026-08-11" and gap["to"] > "2026-08-20" and gap["days"] >= 10


def test_demo_data_never_adds_on_top_of_existing_statements(client):
    client.post("/api/demo-data")
    again = client.post("/api/demo-data")
    assert again.status_code == 409 and again.json()["detail"]["code"] == "HAS_STATEMENTS"
    assert len(client.get("/api/statements").json()["files"]) == 3   # nothing was added


def test_demo_data_replace_swaps_the_dataset(client):
    client.post("/api/demo-data?set=eight_months")
    r = client.post("/api/demo-data?set=short_2mo&replace=true")
    assert r.status_code == 200 and r.json()["replaced"] is True
    files = client.get("/api/statements").json()["files"]
    assert [f["name"] for f in files] == ["bank_c_aug_sep.csv"]      # only the new set, nothing left over


def test_real_duplicate_charge_and_genuine_second_payment_both_kept(client, db_path):
    import sqlite3
    client.post("/api/demo-data")
    db = sqlite3.connect(db_path)
    count = lambda ref: db.execute("SELECT COUNT(*) FROM transactions WHERE description LIKE ?", (f"%{ref}",)).fetchone()[0]
    assert count("ORD-SIM98231") == 2                      # bank charged twice: both rows kept
    assert count("ORD-402-1111") == count("ORD-402-2222") == 1


def test_overlap_rows_are_stored_once(client, db_path):
    import sqlite3
    client.post("/api/demo-data")
    files = client.get("/api/statements").json()["files"]
    stored = sqlite3.connect(db_path).execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    assert stored == sum(f["rows"] for f in files) - sum(f["duplicateRows"] for f in files)
    assert sum(f["duplicateRows"] for f in files) > 0


def test_unknown_demo_set_is_422(client):
    assert client.post("/api/demo-data?set=nope").status_code == 422
