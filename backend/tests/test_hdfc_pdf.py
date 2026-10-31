"""Real-layout HDFC PDFs, using a synthetic statement (tests/hdfc_fixture.py: fake names and numbers only)."""
import pytest

from app.services.hdfc_pdf import find_summary, last4_of
from app.services.parser import StatementRejected, parse_statement
from tests import hdfc_fixture
from tests.make_pdf import make_positioned_pdf


def rows(**kw):
    return parse_statement("statement.pdf", hdfc_fixture.build(**kw)).rows


def reject(reason):
    raise StatementRejected(reason)


def test_masked_account_number_gives_last_4_digits():
    s = parse_statement("statement.pdf", hdfc_fixture.build())
    assert (s.bank, s.last4) == ("HDFC", "9661")
    assert last4_of("Account No: 50100123451234", reject) == "1234"  # an unmasked number still works
    with pytest.raises(StatementRejected, match="could not find the account number"):
        last4_of("Account number : 50XXXXXXXXXXXX", reject)


def test_opening_balance_and_totals_come_from_the_summary():
    summary = find_summary("\n".join(hdfc_fixture.SUMMARY))
    assert summary.opening == 1000000 and (summary.debit_count, summary.credit_count) == (3, 2)
    assert (summary.debits, summary.credits, summary.closing) == (675050, 5150000, 5474950)
    parsed = rows()
    assert sum(-r.amount_paise for r in parsed if r.amount_paise < 0) == summary.debits
    assert sum(r.amount_paise for r in parsed if r.amount_paise > 0) == summary.credits
    assert parsed[0].balance_paise == summary.opening + parsed[0].amount_paise  # chain starts at the summary's opening


def test_wrapped_narrations_are_joined():
    narrations = [r.description for r in rows()]
    assert narrations[0] == "UPI-FAKE GROCER-fakegrocer@okbank-BANK0000001-123456789012-GROCERIES"  # cut mid-token: no space
    assert narrations[1] == "NEFT CR-ACME SOFTWARE PVT LTD-SALARY"  # first part was printed above the date line
    assert narrations[2] == "ATW-512345XXXXXX1234-S1ANBG12-MG ROAD"
    assert narrations[3] == "POS 4123XXXXXXXX9999 FAKE MART"  # an ordinary word wrap keeps its space


def test_zero_cells_two_digit_years_and_balance_chain():
    parsed = rows()
    assert [r.txn_date for r in parsed] == ["2026-09-19", "2026-09-21", "2026-09-25", "2026-10-02", "2026-10-10"]
    assert [r.amount_paise for r in parsed] == [-125050, 5000000, -200000, -350000, 150000]  # '0.00' = empty side
    balance = 1000000
    for r in parsed:
        balance += r.amount_paise
        assert r.balance_paise == balance


def test_page_headers_and_footers_are_not_rows():
    assert len(rows()) == 5
    assert not any("GSTN" in r.description or "Closing balance" in r.description for r in rows())


def test_broken_balance_chain_names_the_row():
    with pytest.raises(StatementRejected, match=r"balance does not add up at row 5 \(10/10/26"):
        rows(last_balance="99,999.00")


def test_row_count_must_match_the_summary():
    summary = hdfc_fixture.SUMMARY[:2] + ["10,000.00 3 2 6,750.50 50,000.00 53,249.50"]
    with pytest.raises(StatementRejected, match="Parsed 4 rows but the statement summary says 5"):
        rows(summary=summary, drop_last_row=True)


def test_totals_must_match_the_summary():
    summary = hdfc_fixture.SUMMARY[:2] + ["10,000.00 3 2 6,999.00 51,500.00 54,749.50"]
    with pytest.raises(StatementRejected, match="Withdrawals add up to ₹6,750.50 but the statement summary says ₹6,999"):
        rows(summary=summary)


def test_without_a_summary_the_opening_balance_is_worked_back_from_the_first_row():
    parsed = rows(summary=["(no summary on this statement)"])
    assert len(parsed) == 5 and parsed[0].amount_paise == -125050


def test_no_rows_and_no_summary_is_a_clear_rejection():
    items, y = hdfc_fixture.page_header(1)
    with pytest.raises(StatementRejected, match="summary is missing"):
        parse_statement("s.pdf", make_positioned_pdf([items]))


def test_upload_of_the_synthetic_statement_and_its_atm_row(client):
    r = client.post("/api/upload", files={"file": ("statement.pdf", hdfc_fixture.build())})
    assert r.status_code in (200, 201)
    tx = client.get("/api/transactions?limit=50").json()["transactions"]
    atm = next(t for t in tx if t["description"].startswith("ATW-"))
    assert atm["kind"] == "transfer"  # an ATM withdrawal moves money to the Cash wallet; it is not spending
