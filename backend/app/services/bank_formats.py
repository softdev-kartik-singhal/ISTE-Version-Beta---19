"""Per-bank CSV column mapping. To support a new bank, add one entry here.

A file is recognised as a bank's format when its header row contains every
column named in that bank's entry. Money columns are in rupees as printed by the bank.
"""

# Keys: date/description/balance are always needed. A bank has EITHER separate
# debit + credit columns OR one amount column plus a Dr/Cr marker column.
BANK_FORMATS = {
    "HDFC": {
        "date": "Date",
        "date_format": "%d/%m/%Y",
        "description": "Narration",
        "debit": "Withdrawal Amt",
        "credit": "Deposit Amt",
        "balance": "Closing Balance",
    },
    "Kotak": {
        "date": "Transaction Date",
        "date_format": "%Y-%m-%d",
        "description": "Description",
        "amount": "Amount",
        "dr_cr": "Dr/Cr",
        "balance": "Balance",
    },
}

# Keys in a mapping that name CSV columns (used to match a header row).
COLUMN_KEYS = ("date", "description", "debit", "credit", "amount", "dr_cr", "balance")


def mapped_columns(fmt):
    """The CSV column names a format requires."""
    return {fmt[k] for k in COLUMN_KEYS if k in fmt}


def find_format(header):
    """Return (bank, mapping) whose columns are all in `header`, else None."""
    cells = {c.strip() for c in header}
    for bank, fmt in BANK_FORMATS.items():
        if mapped_columns(fmt) <= cells:
            return bank, fmt
    return None
