"""Real HDFC e-statement PDFs: a table read by word POSITION, not line by line.

Why positions: in a real HDFC PDF a narration wraps over several lines, and part of it can sit ABOVE the line
that carries the date (the date is vertically centred in a tall row). Reading plain text line by line mixes rows.
So, on every page we:
  1. find the column header line (Date | Narration | Chq./Ref No. | Value Dt | Withdrawal | Deposit | Closing Balance)
     and take each column's x-position from it;
  2. put every word below the header into a column by its x-position, and group words into lines by y-position;
  3. start a transaction on each line that has a date in the Date column;
  4. attach the other lines (wrapped narration) to the nearest transaction line by y-position.
Then we check the numbers twice: every row's balance chain, and the "STATEMENT SUMMARY" block (row counts,
total withdrawals, total deposits, closing balance). Any mismatch rejects the file with a plain reason.
"""
import re
from datetime import datetime
from typing import NamedTuple

from app.services.money import inr

DATE = re.compile(r"^\d{2}/\d{2}/(\d{2}|\d{4})$")
AMOUNT = re.compile(r"^[\d,]+\.\d{2}$")
ACCOUNT = re.compile(r"Account\s*(?:number|No\.?)\s*:?\s*([0-9Xx*]{4,})", re.I)
# Lines under the table that are not transactions: once one appears, the table on that page has ended.
TABLE_END = re.compile(r"closing balance includes|contents of this statement|gstin|gstn|generation date|"
                       r"end of statement|statement summary|registered office", re.I)
COLUMNS = ["date", "narration", "ref", "value_date", "withdrawal", "deposit", "balance"]
HEADER_WORDS = {"date": "Date", "narration": "Narration", "ref": "Chq", "value_date": "Value",
                "withdrawal": "Withdrawal", "deposit": "Deposit", "balance": "Closing"}
LINE_TOLERANCE = 3     # words whose tops differ by less than this (points) are on the same line
WRAP_JOINERS = "-/@.:_"  # a wrapped narration line ending in one of these continues the same token: no space


class Summary(NamedTuple):
    opening: int
    debit_count: int
    credit_count: int
    debits: int
    credits: int
    closing: int


class Line(NamedTuple):
    page: int
    top: float
    cells: dict           # column -> list of words (dicts from pdfplumber)


def paise(text, zero_is_empty=True):
    """'1,234.50' -> 123450 without float maths. HDFC prints an empty amount cell as '0.00': that becomes None
    (but a balance of 0.00 is a real balance, so callers reading balances pass zero_is_empty=False)."""
    whole, _, frac = text.replace(",", "").partition(".")
    value = int(whole or 0) * 100 + int((frac + "00")[:2])
    return None if zero_is_empty and value == 0 else value


def rupees(value):
    """Exact rupees for error messages, paise included when there are any: 675050 -> '₹6,750.50'."""
    whole = inr(abs(value) // 100 * 100)
    return f"{'-' if value < 0 else ''}{whole}" + (f".{abs(value) % 100:02d}" if abs(value) % 100 else "")


def iso_date(text):
    """Both dd/mm/yy (HDFC rows and the statement period) and dd/mm/yyyy."""
    return datetime.strptime(text, "%d/%m/%y" if len(text) == 8 else "%d/%m/%Y").date().isoformat()


# ---------------------------------------------------------------- page layout
def group_lines(words):
    """Words -> lines (lists of words, left to right), top to bottom."""
    lines = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if lines and abs(lines[-1][0]["top"] - w["top"]) < LINE_TOLERANCE:
            lines[-1].append(w)
        else:
            lines.append([w])
    return [sorted(line, key=lambda w: w["x0"]) for line in lines]


def text_of(words):
    return " ".join(w["text"] for w in words)


def find_header(lines):
    """(index of the column header line, {column: left x}) or None if this page has no table header."""
    for i, line in enumerate(lines):
        starts = {}
        for col, word in HEADER_WORDS.items():
            hit = next((w for w in line if w["text"].startswith(word)), None)
            if hit:
                starts[col] = hit["x0"]
        if len(starts) == len(COLUMNS):
            return i, starts
    return None


def column_of(word, starts):
    """The column whose left edge is the last one at or before the word's centre (small margin for alignment)."""
    centre = (word["x0"] + word["x1"]) / 2
    col = "date"
    for name in COLUMNS:
        if centre >= starts[name] - 3:
            col = name
    return col


def table_lines(pdf):
    """Every line of the transaction table on every page, with its words split into columns."""
    out = []
    for page_no, page in enumerate(pdf.pages, start=1):
        lines = group_lines(page.extract_words(keep_blank_chars=False))
        header = find_header(lines)
        if not header:
            continue  # e.g. a last page that only has the summary
        at, starts = header
        for line in lines[at + 1:]:
            if TABLE_END.search(text_of(line)):
                break  # footer or summary: the table on this page is over
            cells = {c: [] for c in COLUMNS}
            for w in line:
                cells[column_of(w, starts)].append(w)
            out.append(Line(page_no, line[0]["top"], cells))
    return out


# ---------------------------------------------------------------- rows
def join_narration(lines):
    """Narration lines in reading order. A line ending in '-', '/', '@'... was cut mid-token, so no space is added."""
    text = ""
    for part in lines:
        if text and text[-1] not in WRAP_JOINERS:
            text += " "
        text += part
    return text.strip()


def build_rows(lines):
    """Anchor lines (with a date) become transactions; other lines attach to the nearest anchor on the same page."""
    anchors = [i for i, l in enumerate(lines) if l.cells["date"] and DATE.match(l.cells["date"][0]["text"])]
    if not anchors:
        return []
    parts = {i: [] for i in anchors}  # anchor -> [(top, text)] of its narration pieces
    for i, line in enumerate(lines):
        words = line.cells["narration"]
        if not words:
            continue
        same_page = [a for a in anchors if lines[a].page == line.page] or anchors
        nearest = min(same_page, key=lambda a: (abs(lines[a].top - line.top), lines[a].top > line.top))  # ties: the row above
        parts[nearest].append((line.top, text_of(words)))
    rows = []
    for a in anchors:
        cells = lines[a].cells
        amount = lambda col, empty=True: next((paise(w["text"], empty) for w in cells[col] if AMOUNT.match(w["text"])), None)
        rows.append({"date": cells["date"][0]["text"], "narration": join_narration(t for _, t in sorted(parts[a])),
                     "withdrawal": amount("withdrawal"), "deposit": amount("deposit"), "balance": amount("balance", False)})
    return rows


# ---------------------------------------------------------------- summary and checks
def find_summary(text):
    """The STATEMENT SUMMARY values: the line after 'Opening Balance Dr Count Cr Count Debits Credits Closing Balance'."""
    lines = [l.strip() for l in text.splitlines()]
    for i, line in enumerate(lines[:-1]):
        if line.lower().startswith("opening balance") and "dr count" in line.lower():
            values = lines[i + 1].split()
            if len(values) == 6 and all(re.match(r"^[\d,]+(\.\d{2})?$", v) for v in values):
                money = lambda v: paise(v, zero_is_empty=False)
                return Summary(money(values[0]), int(values[1].replace(",", "")), int(values[2].replace(",", "")),
                               money(values[3]), money(values[4]), money(values[5]))
    return None


def check_rows(rows, reject):
    """Each row must move money one way only and carry a closing balance."""
    for n, r in enumerate(rows, start=1):
        if r["balance"] is None:
            reject(f"Row {n} ({r['date']}) has no closing balance.")
        if bool(r["withdrawal"]) == bool(r["deposit"]):
            reject(f"Row {n} ({r['date']}) should have either a withdrawal or a deposit, not {'both' if r['withdrawal'] else 'neither'}.")


def check_chain(rows, opening, reject):
    """previous balance - withdrawal + deposit must equal the closing balance printed on every row."""
    previous = opening
    for n, r in enumerate(rows, start=1):
        expected = previous - (r["withdrawal"] or 0) + (r["deposit"] or 0)
        if expected != r["balance"]:
            reject(f"The balance does not add up at row {n} ({r['date']}, {r['narration'][:40]}): "
                   f"expected {rupees(expected)}, the statement shows {rupees(r['balance'])}. Some rows may not have been read.")
        previous = r["balance"]


def check_summary(rows, summary, reject):
    """Row counts and totals must match the bank's own summary."""
    debits = [r["withdrawal"] for r in rows if r["withdrawal"]]
    credits = [r["deposit"] for r in rows if r["deposit"]]
    if len(rows) != summary.debit_count + summary.credit_count:
        reject(f"Parsed {len(rows)} rows but the statement summary says {summary.debit_count + summary.credit_count}.")
    if sum(debits) != summary.debits:
        reject(f"Withdrawals add up to {rupees(sum(debits))} but the statement summary says {rupees(summary.debits)}.")
    if sum(credits) != summary.credits:
        reject(f"Deposits add up to {rupees(sum(credits))} but the statement summary says {rupees(summary.credits)}.")
    if rows[-1]["balance"] != summary.closing:
        reject(f"The last row's balance is {rupees(rows[-1]['balance'])} but the statement summary says {rupees(summary.closing)}.")


def last4_of(text, reject):
    """'Account number : 50XXXXXXXX9661' (HDFC masks it) or 'Account No: 50100123459661' -> '9661'."""
    match = ACCOUNT.search(text)
    if not match or not match.group(1)[-4:].isdigit():
        reject("We could not find the account number on the statement (we look for 'Account number : ...').")
    return match.group(1)[-4:]


def has_table(pdf):
    return any(find_header(group_lines(p.extract_words())) for p in pdf.pages)


def parse(pdf, text, reject, make_row):
    """The statement as (last4, rows). `reject(reason)` raises; `make_row` builds the shared Row type."""
    last4 = last4_of(text, reject)
    rows = build_rows(table_lines(pdf))
    summary = find_summary(text)
    if not rows:
        reject("No transaction rows were found in the statement table." if summary else
               "No transaction rows were found and the statement summary is missing, so the opening balance is unknown.")
    check_rows(rows, reject)
    # Opening balance: from the summary; if there is none, work it back from the first row.
    opening = summary.opening if summary else rows[0]["balance"] + (rows[0]["withdrawal"] or 0) - (rows[0]["deposit"] or 0)
    check_chain(rows, opening, reject)
    if summary:
        check_summary(rows, summary, reject)
    return last4, [make_row(iso_date(r["date"]), (r["deposit"] or 0) - (r["withdrawal"] or 0), r["balance"], r["narration"])
                   for r in rows]
