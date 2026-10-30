"""Phase 1 tests: schema loads, and every planted demo case is present in the CSVs."""
import csv
import sqlite3
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.db import connect, init_db  # noqa: E402
from demo_data.generate import generate  # noqa: E402


@pytest.fixture(scope="module")
def data(tmp_path_factory):
    out = tmp_path_factory.mktemp("demo")
    return out, generate(out)


def read_rows(path):
    """Return (header, rows) skipping the 'Account No' preamble line."""
    with open(path) as f:
        lines = list(csv.reader(f))
    return lines[1], lines[2:]


def bank_a_signed(row):
    """Bank A style row -> (date, text, signed rupees, balance)."""
    d, text, wd, dep, bal = row
    day, mon, yr = d.split("/")
    amt = -float(wd) if wd else float(dep)
    return date(int(yr), int(mon), int(day)), text, amt, float(bal)


def bank_b_signed(row):
    d, text, amt, drcr, bal = row
    return date.fromisoformat(d), text, -float(amt) if drcr == "DR" else float(amt), float(bal)


def all_a(out):
    rows = []
    for name in ("bank_a_feb_jul.csv", "bank_a_jul_sep.csv"):
        rows += [bank_a_signed(r) for r in read_rows(out / "eight_months" / name)[1]]
    return rows


def all_b(out):
    return [bank_b_signed(r) for r in read_rows(out / "eight_months/bank_b_feb_sep.csv")[1]]


# ---------- schema ----------

def test_all_tables_created():
    conn = connect(":memory:")
    init_db(conn)
    names = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    expected = {"users", "accounts", "transactions", "uploaded_files", "categories", "category_rules",
                "corrections", "flag_decisions", "recurring", "forecast_log", "goals", "cards"}
    assert expected <= names


def test_fingerprint_is_unique():
    conn = connect(":memory:")
    init_db(conn)
    conn.execute("INSERT INTO users (name, email, password_hash) VALUES ('a', 'a@x.in', 'h')")
    conn.execute("INSERT INTO accounts (user_id, bank, last4) VALUES (1, 'HDFC', '1234')")
    sql = "INSERT INTO transactions (account_id, txn_date, amount_paise, description, fingerprint) VALUES (1, '2026-01-01', -100, 'x', 'abc')"
    conn.execute(sql)
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute(sql)


def test_account_must_be_masked_to_four_digits():
    conn = connect(":memory:")
    init_db(conn)
    conn.execute("INSERT INTO users (name, email, password_hash) VALUES ('a', 'a@x.in', 'h')")
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("INSERT INTO accounts (user_id, bank, last4) VALUES (1, 'HDFC', '50100123451234')")


# ---------- demo data ----------

def test_files_written(data):
    out, _ = data
    for p in ["eight_months/bank_a_feb_jul.csv", "eight_months/bank_a_jul_sep.csv",
              "eight_months/bank_b_feb_sep.csv", "short_2mo/bank_c_aug_sep.csv", "planted_cases.json"]:
        assert (out / p).exists()


def test_eight_months_span(data):
    out, _ = data
    days = [r[0] for r in all_a(out)]
    assert min(days) < date(2026, 2, 5)
    assert max(days) >= date(2026, 9, 28)


def test_short_dataset_is_two_months(data):
    out, _ = data
    rows = [bank_a_signed(r) for r in read_rows(out / "short_2mo/bank_c_aug_sep.csv")[1]]
    assert {(d.year, d.month) for d, *_ in rows} == {(2026, 8), (2026, 9)}


def test_overlapping_exports_share_identical_rows(data):
    out, _ = data
    one = {tuple(r) for r in read_rows(out / "eight_months/bank_a_feb_jul.csv")[1]}
    two = {tuple(r) for r in read_rows(out / "eight_months/bank_a_jul_sep.csv")[1]}
    assert len(one & two) >= 3  # same rows, same balances, in both files


def test_own_account_transfer_pairs(data):
    out, _ = data
    debit = [r for r in all_a(out) if "SELF TRANSFER TO KOTAK" in r[1]]
    credit = [r for r in all_b(out) if "1234-SELF TRANSFER" in r[1]]
    assert {(d, a) for d, _, a, _ in debit} == {(d, -a) for d, _, a, _ in credit}


def test_real_duplicate_charge_has_same_ref_different_balance(data):
    out, _ = data
    rows = [r for r in all_b(out) if "ORD-SIM98231" in r[1]]
    assert len(rows) == 2 and rows[0][0] == rows[1][0] and rows[0][2] == rows[1][2]
    assert rows[0][3] != rows[1][3]


def test_genuine_second_payment_has_different_refs_and_balance(data):
    out, _ = data
    rows = [r for r in all_b(out) if r[1].startswith("UPI/AMAZON PAY/ORD-402")]
    assert len(rows) == 2 and rows[0][1] != rows[1][1]
    assert rows[0][2] == rows[1][2] and rows[0][3] != rows[1][3]


def test_bonus_appears_once_only(data):
    out, _ = data
    bonus = [r for r in all_a(out) if "BONUS" in r[1]]
    assert {r[0] for r in bonus} == {date(2026, 2, 14)}


def test_freelance_income_is_irregular(data):
    out, _ = data
    amounts = {r[2] for r in all_b(out) if "FREELANCE" in r[1]}
    months = Counter(r[0].month for r in all_b(out) if "FREELANCE" in r[1])
    assert len(amounts) > 3 and months[3] == 0 and months[6] == 0


def test_recurring_items_monthly(data):
    out, _ = data
    a, b = all_a(out), all_b(out)
    for text, rows in [("EMI", a), ("RENT", a), ("NETFLIX", b), ("SPOTIFY", b)]:
        assert len([r for r in rows if text in r[1].upper()]) >= 7


def test_large_purchase_and_new_merchant(data):
    out, _ = data
    assert any("CROMA" in r[1] and r[2] == -82000 for r in all_a(out))
    cursor = [r for r in all_b(out) if "CURSOR" in r[1]]
    assert len(cursor) == 1 and cursor[0][0] == date(2026, 9, 14)


def test_ten_day_gap_in_bank_b(data):
    out, _ = data
    days = sorted({r[0] for r in all_b(out)})
    biggest = max((b - a).days for a, b in zip(days, days[1:]))
    assert biggest >= 10
    assert not any(date(2026, 8, 11) <= d <= date(2026, 8, 20) for d in days)


def test_balances_never_negative(data):
    out, _ = data
    assert min(r[3] for r in all_a(out)) > 0 and min(r[3] for r in all_b(out)) > 0


def test_generation_is_deterministic(tmp_path):
    generate(tmp_path / "x")
    generate(tmp_path / "y")
    f = "eight_months/bank_b_feb_sep.csv"
    assert (tmp_path / "x" / f).read_text() == (tmp_path / "y" / f).read_text()
