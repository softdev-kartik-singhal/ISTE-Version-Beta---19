"""A bank-PDF month is full of small UPI payments with long narrations. The money-flow chart must stay readable:
names are read properly, and small income sources are grouped into one node (spending is already capped the same way)."""
import pytest

from app.db import connect, refresh_merchants
from app.services.merchant import merchant_of
from app.services.moneyflow import build_graph
from tests.hdfc_fixture import build


@pytest.mark.parametrize("narration, name", [
    ("UPI-SUNIL KUMAR SINGHAL-7974896286@PTYES-UTIB0001055-615048397167-SENT USING PAYTM U", "SUNIL KUMAR SINGHAL"),
    ("UPI-GOOGLE INDIA DIGITAL-GOOG-PAYMENTS@AXISBANK-UTIB0000553-648077252676-REWARDED ON SEPTEM", "GOOGLE INDIA DIGITAL"),
    ("UPI-HITESH SANGHI-HITESH.2006SANGHI@OKAXIS-UCBA0000048-662993681228-KARTIK CASH TO UPI", "HITESH SANGHI"),
    ("UPI-SWIGGY LIMITED-SWIGGY.REFUNDS@AXISBANK-UTIB0000052-222436102696-ORDERCANCEL", "SWIGGY LIMITED"),
    ("POS 4123XXXXXXXX9999 FAKE MART", "FAKE MART"),
])
def test_bank_pdf_narrations_give_a_short_readable_name(narration, name):
    assert merchant_of(narration) == name


@pytest.mark.parametrize("narration, name", [
    ("UPI/SWIGGY/9285415473", "SWIGGY"),                                  # the CSV forms are unchanged
    ("POS CROMA ELECTRONICS BLR", "CROMA ELECTRONICS BLR"),
    ("NEFT CR-ACME TECH PVT LTD-SALARY", "ACME TECH PVT LTD-SALARY"),
])
def test_other_narrations_read_as_before(narration, name):
    assert merchant_of(narration) == name


def credit(merchant, paise):
    return {"amount_paise": paise, "merchant": merchant, "bank": "HDFC", "last4": "9661", "category": "Other Income"}


def test_small_income_sources_are_grouped_into_one_node():
    rows = [credit(f"PERSON {i}", 1_000_00 * (10 - i)) for i in range(10)]          # ten different senders
    nodes, links = build_graph(rows, top_n=5)
    sources = {n["name"]: n["amountPaise"] for n in nodes if n["column"] == 0}
    assert len(sources) == 6 and "Other income" in sources                        # the 5 biggest + the rest together
    assert sources["Other income"] == sum(1_000_00 * (10 - i) for i in range(5, 10))
    assert sum(sources.values()) == sum(r["amount_paise"] for r in rows)            # nothing is lost
    assert sum(l["valuePaise"] for l in links) == sum(r["amount_paise"] for r in rows)


def test_a_single_extra_source_is_not_hidden_behind_other_income():
    rows = [credit(f"PERSON {i}", 1_000_00 * (10 - i)) for i in range(6)]           # exactly one more than the cap
    nodes, _ = build_graph(rows, top_n=5)
    assert {n["name"] for n in nodes if n["column"] == 0} == {f"PERSON {i}" for i in range(6)}


def test_merchants_stored_with_the_whole_narration_are_corrected(client, db_path):
    assert client.post("/api/upload", files={"file": ("hdfc.pdf", build(), "application/pdf")}).status_code == 200
    long = "UPI-FAKE GROCER-fakegrocer@okbank-BANK0000001-123456789012-GROCERIES"
    with connect(db_path) as conn:
        conn.execute("UPDATE transactions SET merchant = description WHERE description = ?", (long,))   # how old rows look
        conn.commit()
        assert conn.execute("SELECT merchant FROM transactions WHERE description = ?", (long,)).fetchone()["merchant"] == long
        refresh_merchants(conn)
        conn.commit()
        assert conn.execute("SELECT merchant FROM transactions WHERE description = ?", (long,)).fetchone()["merchant"] == "FAKE GROCER"
