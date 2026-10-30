"""Turn an uploaded statement (CSV or PDF bytes) into clean rows.

Nothing here touches the database or disk. Unknown or broken files raise
StatementRejected with a human-readable reason.
"""
import csv
import io
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import NamedTuple

import pdfplumber

from app.services.bank_formats import BANK_FORMATS, find_format


class StatementRejected(Exception):
    """The file cannot be imported; str(e) is the reason shown to the user."""


class Row(NamedTuple):
    txn_date: str             # ISO yyyy-mm-dd
    amount_paise: int         # negative = money out
    balance_paise: int | None
    description: str


class Statement(NamedTuple):
    bank: str
    last4: str                # the full account number is never kept
    rows: list


def mask_account(number):
    """Keep only the last 4 digits of an account number."""
    digits = re.sub(r"\D", "", number or "")
    if len(digits) < 4:
        raise StatementRejected("Could not find a valid account number in the file.")
    return digits[-4:]


def to_paise(text):
    """'1,234.50' -> 123450. Empty text -> None. Uses Decimal so no float rounding."""
    text = (text or "").replace(",", "").strip()
    if not text:
        return None
    try:
        return int((Decimal(text) * 100).to_integral_value())
    except InvalidOperation:
        raise StatementRejected(f"'{text}' is not a valid amount.")


def to_iso(text, date_format):
    try:
        return datetime.strptime(text.strip(), date_format).date().isoformat()
    except ValueError:
        raise StatementRejected(f"'{text}' is not a valid date (expected format {date_format}).")


def signed_amount(record, fmt):
    """Signed paise for one CSV record, using either debit/credit or amount+Dr/Cr columns."""
    if "amount" in fmt:
        amount = to_paise(record[fmt["amount"]])
        marker = record[fmt["dr_cr"]].strip().upper()
        if amount is None or marker not in ("DR", "CR"):
            raise StatementRejected("Row has no amount or no Dr/Cr marker.")
        return -amount if marker == "DR" else amount
    debit, credit = to_paise(record[fmt["debit"]]), to_paise(record[fmt["credit"]])
    if debit is None and credit is None:
        raise StatementRejected("Row has neither a withdrawal nor a deposit.")
    return -debit if debit else credit


def parse_csv(data):
    """Parse a bank CSV: optional 'Account No' line, a header row, then data rows."""
    try:
        lines = list(csv.reader(io.StringIO(data.decode("utf-8-sig"))))
    except UnicodeDecodeError:
        raise StatementRejected("File is not readable text; is it really a CSV?")
    account, bank, fmt, header_at = None, None, None, None
    for i, cells in enumerate(lines[:20]):  # the preamble is short; do not scan the whole file
        if cells and cells[0].strip().lower().startswith("account no") and len(cells) > 1:
            account = cells[1]
        found = find_format(cells)
        if found:
            (bank, fmt), header_at = found, i
            break
    if fmt is None:
        known = ", ".join(BANK_FORMATS)
        raise StatementRejected(f"Unrecognised CSV format: no header row matches a supported bank ({known}).")
    if account is None:
        raise StatementRejected("Missing 'Account No' line above the header row.")

    header = [c.strip() for c in lines[header_at]]
    rows = []
    for n, cells in enumerate(lines[header_at + 1:], start=header_at + 2):
        if not any(c.strip() for c in cells):
            continue  # blank line
        record = dict(zip(header, cells))
        try:
            rows.append(Row(to_iso(record[fmt["date"]], fmt["date_format"]), signed_amount(record, fmt),
                            to_paise(record[fmt["balance"]]), record[fmt["description"]].strip()))
        except StatementRejected as e:
            raise StatementRejected(f"Line {n}: {e}")
    if not rows:
        raise StatementRejected("The file has a header but no transactions.")
    return Statement(bank, mask_account(account), rows)


# PDF layout (HDFC only): "dd/mm/yyyy <narration> <amount> <balance>" per line, plus
# "Account No: ..." and "Opening Balance ..." lines. The PDF has no Dr/Cr column, so the
# direction comes from whether the balance went down or up.
PDF_ROW = re.compile(r"^(\d{2}/\d{2}/\d{4}) (.+) ([\d,]+\.\d{2}) ([\d,]+\.\d{2})$")
PDF_ACCOUNT = re.compile(r"Account No:?\s*(\S+)", re.I)
PDF_OPENING = re.compile(r"Opening Balance\s+([\d,]+\.\d{2})", re.I)


def parse_pdf(data):
    """Parse an HDFC-layout PDF statement; reject any other layout."""
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception:
        raise StatementRejected("PDF could not be opened (corrupt or password-protected).")
    if not text.strip():
        raise StatementRejected("PDF has no readable text (scanned image?). Upload the CSV instead.")
    if "HDFC BANK" not in text.upper():
        raise StatementRejected("Unsupported PDF layout: only HDFC Bank PDF statements are supported.")
    account, opening = PDF_ACCOUNT.search(text), PDF_OPENING.search(text)
    if not account or not opening:
        raise StatementRejected("PDF is missing the 'Account No' or 'Opening Balance' line.")

    rows, previous = [], to_paise(opening.group(1))
    for line in text.splitlines():
        m = PDF_ROW.match(line.strip())
        if not m:
            continue
        amount, balance = to_paise(m.group(3)), to_paise(m.group(4))
        signed = balance - previous  # direction = how the balance moved
        if abs(signed) != amount:
            raise StatementRejected(f"Row '{line.strip()}' does not reconcile with the running balance.")
        rows.append(Row(to_iso(m.group(1), "%d/%m/%Y"), signed, balance, m.group(2).strip()))
        previous = balance
    if not rows:
        raise StatementRejected("No transaction rows found in the PDF.")
    return Statement("HDFC", mask_account(account.group(1)), rows)


def parse_statement(filename, data):
    """Pick the parser from the file's content (PDF magic bytes) or extension (.csv)."""
    if not data:
        raise StatementRejected("The file is empty.")
    if data.startswith(b"%PDF"):
        return parse_pdf(data)
    if filename.lower().endswith(".csv"):
        return parse_csv(data)
    raise StatementRejected("Only CSV and PDF statements are supported.")
