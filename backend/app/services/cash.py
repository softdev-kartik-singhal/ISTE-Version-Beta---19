"""Cash wallet: cash the bank statements cannot show, without ever counting the same rupee twice.

THE NO-DOUBLE-COUNTING RULE (read this first)
  * An ATM withdrawal in a bank statement is NOT spending. It is money moving from the bank into the Cash wallet,
    so we mark that bank row kind='transfer' and every report ignores it (just like a transfer between own accounts).
  * The spending happens later, when the user records it as a manual row in the wallet (a normal negative row).
    So ₹1,000 withdrawn + ₹600 Travel + ₹400 Food recorded = ₹1,000 of spending, not ₹2,000.
  * A cash deposit into the bank is also a transfer (wallet -> bank), so it is never income.
  * Cash that is withdrawn but never recorded would vanish from the forecast, so after CASH_UNRECORDED_DAYS the
    leftover is counted as "Cash — not recorded" spending, worked out fresh every time (nothing is stored).

  wallet balance = cash withdrawn + cash received - cash spent - cash deposited
"""
import re
import uuid
from datetime import date, timedelta

from app import config

# SQL fragment: manual wallet rows only count up to the date of the latest bank statement, so cash typed in for
# "today" cannot stretch the statement months (the forecast works in whole statement months).
WITHIN_STATEMENTS = ("(a.type != 'cash' OR t.txn_date <= COALESCE((SELECT MAX(t2.txn_date) FROM transactions t2"
                     " JOIN accounts a2 ON a2.id = t2.account_id WHERE a2.user_id = a.user_id AND a2.type != 'cash'), '0000-00-00'))")
SOURCE_CATEGORY = {"gift": "Other Income", "salary in cash": "Salary", "freelance": "Freelance", "other": "Other Income"}


class CashError(Exception):
    def __init__(self, reason, status=422):
        self.reason, self.status = reason, status


def label(bank, last4):
    """Account text for screens: the wallet is just 'Cash wallet'."""
    return config.CASH_BANK if bank == config.CASH_BANK else f"{bank} ••{last4}"


# ---------------------------------------------------------------- the wallet account
def wallet_id(conn, user_id):
    """The user's Cash wallet account (made on first use)."""
    conn.execute("INSERT OR IGNORE INTO accounts (user_id, bank, last4, type) VALUES (?, ?, ?, 'cash')",
                 (user_id, config.CASH_BANK, config.CASH_LAST4))
    return conn.execute("SELECT id FROM accounts WHERE user_id = ? AND type = 'cash'", (user_id,)).fetchone()["id"]


def category_id(conn, name):
    row = conn.execute("SELECT id FROM categories WHERE name = ?", (name,)).fetchone()
    return row["id"] if row else None


# ---------------------------------------------------------------- ATM withdrawals and cash deposits in bank rows
def words_regex(words):
    return re.compile(r"\b(" + "|".join(re.escape(w) for w in words) + r")\b")


ATM = words_regex(config.ATM_WITHDRAWAL_WORDS)
DEPOSIT = words_regex(config.CASH_DEPOSIT_WORDS)


def plain(text):
    """Upper-case with punctuation turned into spaces, so 'ATM/WDL-1234' matches 'ATM WDL'."""
    return re.sub(r"[^A-Z0-9]+", " ", (text or "").upper())


def is_withdrawal(row):
    return row["amount_paise"] < 0 and bool(ATM.search(plain(row["description"])))


def is_deposit(row):
    return row["amount_paise"] > 0 and bool(DEPOSIT.search(plain(row["description"])))


def mark_cash_transfers(conn, user_id):
    """Turn bank ATM withdrawals and cash deposits into transfers (bank <-> Cash wallet). Safe to repeat."""
    rows = conn.execute("SELECT t.id, t.amount_paise, t.description FROM transactions t JOIN accounts a ON a.id = t.account_id"
                        " WHERE a.user_id = ? AND a.type != 'cash' AND t.kind = 'normal'", (user_id,)).fetchall()
    ids = [r["id"] for r in rows if is_withdrawal(r) or is_deposit(r)]
    if ids:
        transfer = category_id(conn, "Transfer")
        conn.executemany("UPDATE transactions SET kind = 'transfer', category_id = ? WHERE id = ?", [(transfer, i) for i in ids])
        conn.commit()
    return len(ids)


def bank_cash_moves(conn, user_id):
    """(withdrawals, deposits) from the bank statements: dicts with id, date, amount (positive paise), description."""
    rows = conn.execute("SELECT t.id, t.txn_date, t.amount_paise, t.description FROM transactions t JOIN accounts a ON a.id = t.account_id"
                        " WHERE a.user_id = ? AND a.type != 'cash' AND t.kind = 'transfer' ORDER BY t.txn_date, t.id", (user_id,)).fetchall()
    make = lambda r: {"id": r["id"], "date": r["txn_date"], "amount": abs(r["amount_paise"])}
    return [make(r) for r in rows if is_withdrawal(r)], [make(r) for r in rows if is_deposit(r)]


# ---------------------------------------------------------------- manual rows
def manual_rows(conn, user_id):
    return conn.execute(
        "SELECT t.id, t.txn_date, t.amount_paise, t.merchant, t.note, c.name AS category FROM transactions t"
        " JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
        " WHERE a.user_id = ? AND a.type = 'cash' AND t.source = 'manual' ORDER BY t.txn_date DESC, t.id DESC", (user_id,)).fetchall()


def entry_view(r):
    received = r["amount_paise"] > 0
    return {"id": r["id"], "type": "received" if received else "spent", "amountPaise": abs(r["amount_paise"]), "date": r["txn_date"],
            "category": r["category"], "sourceType": r["merchant"][5:].lower() if received else None, "note": r["note"]}


# ---------------------------------------------------------------- balance, leftovers and unrecorded cash
def remaining_by_withdrawal(withdrawals, received, outflows, upto=None):
    """How much of each withdrawal is still unspent. Cash is used oldest first: every outflow (spent or deposited)
    takes from the oldest cash that is left. Outflows after `upto` are ignored."""
    lots = sorted([(w["date"], w["id"], w["amount"]) for w in withdrawals] + [(r["date"], -r["id"], r["amount"]) for r in received])
    left = {lot_id: amount for _, lot_id, amount in lots}
    for when, amount in sorted(outflows):
        if upto and when > upto:
            break
        for _, lot_id, _ in lots:
            take = min(left[lot_id], amount)
            left[lot_id] -= take
            amount -= take
            if not amount:
                break
    return {w["id"]: left[w["id"]] for w in withdrawals}


def wallet_state(conn, user_id):
    """Everything about the wallet in one place (cash moves, entries, leftovers)."""
    withdrawals, deposits = bank_cash_moves(conn, user_id)
    spent, received = [], []
    for r in manual_rows(conn, user_id):
        (received if r["amount_paise"] > 0 else spent).append({"id": r["id"], "date": r["txn_date"], "amount": abs(r["amount_paise"])})
    outflows = [(s["date"], s["amount"]) for s in spent] + [(d["date"], d["amount"]) for d in deposits]
    return {"withdrawals": withdrawals, "deposits": deposits, "spent": spent, "received": received, "outflows": outflows}


def unrecorded_by_withdrawal(state, ref):
    """{withdrawal id: leftover paise} for withdrawals older than CASH_UNRECORDED_DAYS still holding unspent cash."""
    out = {}
    for w in state["withdrawals"]:
        cutoff = date.fromisoformat(w["date"]) + timedelta(days=config.CASH_UNRECORDED_DAYS)
        if cutoff < ref:
            left = remaining_by_withdrawal(state["withdrawals"], state["received"], state["outflows"], cutoff.isoformat())[w["id"]]
            if left > 0:
                out[w["id"]] = left
    return out


def unrecorded_rows(conn, user_id, ref=None):
    """Made-up spending rows ('Cash — not recorded', in the month of the withdrawal) shaped like ledger rows."""
    state = wallet_state(conn, user_id)
    if not state["withdrawals"]:
        return []
    leftovers = unrecorded_by_withdrawal(state, ref or date.today())
    wid = wallet_id(conn, user_id)
    dates = {w["id"]: w["date"] for w in state["withdrawals"]}
    return [{"id": -w_id, "account_id": wid, "txn_date": dates[w_id], "amount_paise": -left, "balance_paise": None, "merchant": "CASH",
             "kind": "normal", "category": config.UNRECORDED_CATEGORY, "bank": config.CASH_BANK, "last4": config.CASH_LAST4}
            for w_id, left in leftovers.items()]


def cash_payload(conn, user_id):
    """GET /api/cash."""
    mark_cash_transfers(conn, user_id)
    wallet_id(conn, user_id)
    conn.commit()
    state = wallet_state(conn, user_id)
    sums = {k: sum(x["amount"] for x in state[k]) for k in ("withdrawals", "deposits", "spent", "received")}
    balance = sums["withdrawals"] + sums["received"] - sums["spent"] - sums["deposits"]
    leftovers = unrecorded_by_withdrawal(state, date.today())
    unaccounted = remaining_by_withdrawal(state["withdrawals"], state["received"], state["outflows"])
    recent = [{"id": w["id"], "date": w["date"], "amountPaise": w["amount"], "unaccountedPaise": unaccounted[w["id"]]}
              for w in sorted(state["withdrawals"], key=lambda w: (w["date"], w["id"]), reverse=True)[:10]]
    return {"wallet": {"balancePaise": balance, "withdrawnPaise": sums["withdrawals"], "receivedPaise": sums["received"],
                       "spentPaise": sums["spent"], "depositedPaise": sums["deposits"],
                       "notRecordedPaise": max(0, balance), "countedAsSpendingPaise": sum(leftovers.values()),
                       "unrecordedDays": config.CASH_UNRECORDED_DAYS},
            "entries": [entry_view(r) for r in manual_rows(conn, user_id)], "withdrawals": recent}


# ---------------------------------------------------------------- add, change, delete, split
def check_date(text):
    day = text or date.today().isoformat()
    try:
        if date.fromisoformat(day) > date.today():
            raise CashError("The date cannot be in the future.")
    except ValueError:
        raise CashError("The date must look like 2026-10-31.") from None
    return day


def row_fields(kind, amount_paise, category, source_type):
    """(signed amount, category id, merchant) for a spent / received entry, or CashError."""
    if amount_paise <= 0:
        raise CashError("Enter an amount above zero.")
    if kind == "received":
        if source_type not in config.CASH_SOURCES:
            raise CashError("Choose where the cash came from: " + ", ".join(config.CASH_SOURCES) + ".")
        return amount_paise, "CASH " + source_type.upper(), None
    return -amount_paise, "CASH", category


def category_for(conn, kind, name, source_type):
    if kind == "received":
        return category_id(conn, SOURCE_CATEGORY[source_type])
    row = conn.execute("SELECT id FROM categories WHERE name = ? AND kind = 'expense'", (name,)).fetchone()
    if not row:
        raise CashError("Choose a spending category.")
    return row["id"]


def is_duplicate(conn, user_id, amount, cat_id, day):
    """Same amount, category and date already typed in? (Only a warning: two identical purchases can be real.)"""
    return conn.execute("SELECT 1 FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE a.user_id = ? AND a.type = 'cash'"
                        " AND t.source = 'manual' AND t.amount_paise = ? AND t.category_id IS ? AND t.txn_date = ?",
                        (user_id, amount, cat_id, day)).fetchone() is not None


def add_entry(conn, user_id, kind, amount_paise, category=None, source_type=None, day=None, note=None):
    day = check_date(day)
    amount, merchant, _ = row_fields(kind, amount_paise, category, source_type)
    cat_id = category_for(conn, kind, category, source_type)
    duplicate = is_duplicate(conn, user_id, amount, cat_id, day)
    # Manual rows skip the bank-row fingerprint dedup: they get a unique fingerprint of their own.
    cur = conn.execute(
        "INSERT INTO transactions (account_id, txn_date, amount_paise, description, merchant, category_id, fingerprint, source, note)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?)",
        (wallet_id(conn, user_id), day, amount, f"Cash {kind}", merchant, cat_id, f"manual|{uuid.uuid4().hex}", (note or "").strip()[:200] or None))
    conn.commit()
    return cur.lastrowid, duplicate


def own_entry(conn, user_id, entry_id):
    row = conn.execute("SELECT t.id, t.amount_paise, t.txn_date, t.note, t.merchant, c.name AS category FROM transactions t"
                       " JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
                       " WHERE t.id = ? AND a.user_id = ? AND a.type = 'cash' AND t.source = 'manual'", (entry_id, user_id)).fetchone()
    if not row:
        raise CashError("Cash entry not found.", 404)
    return row


def update_entry(conn, user_id, entry_id, changes):
    """Change any of amountPaise, category, sourceType, date, note on one manual row."""
    row = own_entry(conn, user_id, entry_id)
    kind = "received" if row["amount_paise"] > 0 else "spent"
    amount = changes.get("amountPaise") or abs(row["amount_paise"])
    source = changes.get("sourceType") or (row["merchant"][5:].lower() if kind == "received" else None)
    name = changes.get("category") or row["category"]
    day = check_date(changes.get("date") or row["txn_date"])
    signed, merchant, _ = row_fields(kind, amount, name, source)
    note = changes["note"].strip()[:200] or None if "note" in changes and changes["note"] is not None else row["note"]
    conn.execute("UPDATE transactions SET amount_paise = ?, txn_date = ?, merchant = ?, category_id = ?, note = ? WHERE id = ?",
                 (signed, day, merchant, category_for(conn, kind, name, source), note, entry_id))
    conn.commit()


def delete_entry(conn, user_id, entry_id):
    own_entry(conn, user_id, entry_id)
    conn.execute("DELETE FROM transactions WHERE id = ?", (entry_id,))
    conn.commit()


def split_withdrawal(conn, user_id, withdrawal_id, parts):
    """Record where one ATM withdrawal went: several spent rows dated the day of the withdrawal.
    The parts may not add up to more than the withdrawal (what is left stays in the wallet)."""
    mark_cash_transfers(conn, user_id)
    withdrawals, _ = bank_cash_moves(conn, user_id)
    w = next((w for w in withdrawals if w["id"] == withdrawal_id), None)
    if not w:
        raise CashError("That ATM withdrawal was not found.", 404)
    if not parts or sum(p["amountPaise"] for p in parts) > w["amount"]:
        raise CashError("The parts must add up to no more than the withdrawal.")
    for p in parts:  # validate everything first so a bad row does not leave half the split saved
        row_fields("spent", p["amountPaise"], p["category"], None)
        category_for(conn, "spent", p["category"], None)
    for p in parts:
        add_entry(conn, user_id, "spent", p["amountPaise"], p["category"], day=w["date"], note="Split from ATM withdrawal")
