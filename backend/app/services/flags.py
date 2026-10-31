"""Anomaly flags, each with a plain-language reason. Flags are recomputed on demand;
only the user's decisions are stored (so a decision is remembered, a flag is never re-asked)."""
from collections import defaultdict
from datetime import date, timedelta
from statistics import median

from app.config import (DUPLICATE_WINDOW_DAYS, LARGE_MIN_HISTORY, LARGE_MIN_PAISE, LARGE_PURCHASE_MULTIPLE,
                        NEW_MERCHANT_MIN_PAISE, NEW_MERCHANT_WARMUP_DAYS)
from app.services.merchant import ref_of

DECISIONS = ("confirmed", "dismissed")


def rs(paise):
    """Plain rupee text for reason strings (the frontend formats money elsewhere)."""
    return f"Rs {paise / 100:,.0f}"


def load_rows(conn, user_id):
    return conn.execute(
        "SELECT t.id, t.txn_date, t.amount_paise, t.description, t.merchant, t.kind, c.name AS category,"
        " a.bank, a.last4 FROM transactions t JOIN accounts a ON a.id = t.account_id"
        " LEFT JOIN categories c ON c.id = t.category_id WHERE a.user_id = ? AND t.kind != 'transfer'"
        " ORDER BY t.txn_date, t.id", (user_id,)).fetchall()


def make_flag(kind, row, reason, **extra):
    return {"id": f"{kind}-{row['id']}", "type": kind, "transactionId": row["id"], "date": row["txn_date"],
            "merchant": row["merchant"], "amountPaise": abs(row["amount_paise"]), "category": row["category"],
            "account": f"{row['bank']} ••{row['last4']}", "reason": reason, **extra}


def large_flags(rows):
    """Spend over LARGE_PURCHASE_MULTIPLE x the median of the user's OTHER purchases in that category."""
    spend = defaultdict(list)
    for r in rows:
        if r["amount_paise"] < 0 and r["kind"] == "normal":
            spend[r["category"]].append(r)
    flags = []
    for category, group in spend.items():
        for r in group:
            others = [-o["amount_paise"] for o in group if o["id"] != r["id"]]
            amount = -r["amount_paise"]
            if len(others) < LARGE_MIN_HISTORY or amount < LARGE_MIN_PAISE:
                continue
            usual = median(others)
            if amount > LARGE_PURCHASE_MULTIPLE * usual:
                flags.append(make_flag("large", r, f"{rs(amount)} is {amount / usual:.1f}x your usual {category} "
                                       f"purchase (median {rs(usual)})", multiple=round(amount / usual, 1), usualPaise=int(usual)))
    return flags


def duplicate_flags(rows):
    """Same merchant + amount within the window, with the same order reference (or none on either).

    Re-exported rows never get here (Phase 2 drops them), so these two rows have different
    balances: the bank really took the money twice. A different reference = a separate order.
    """
    groups = defaultdict(list)
    for r in rows:
        if r["amount_paise"] < 0 and r["merchant"]:
            groups[(r["merchant"], r["amount_paise"])].append(r)
    flags = []
    for (merchant, amount), group in groups.items():
        for first, second in zip(group, group[1:]):
            days = (date.fromisoformat(second["txn_date"]) - date.fromisoformat(first["txn_date"])).days
            ref1, ref2 = ref_of(first["description"]), ref_of(second["description"])
            if days <= DUPLICATE_WINDOW_DAYS and ref1 == ref2:
                how = f"same reference {ref1}" if ref1 else "no reference to tell them apart"
                when = "on the same day" if days == 0 else f"{days} day(s) apart"
                flags.append(make_flag("duplicate", second, f"{rs(-amount)} paid to {merchant} twice, {when}, "
                                       f"{how}", originalId=first["id"], originalDate=first["txn_date"], ref=ref1))
    return flags


def new_merchant_flags(rows):
    """First-ever payment to a merchant, big enough to matter, after the warm-up period."""
    if not rows:
        return []
    cutoff = date.fromisoformat(rows[0]["txn_date"]) + timedelta(days=NEW_MERCHANT_WARMUP_DAYS)
    seen, flags = set(), []
    for r in rows:
        if r["merchant"] and r["merchant"] not in seen and r["amount_paise"] < 0 and r["kind"] == "normal":
            amount = -r["amount_paise"]
            if date.fromisoformat(r["txn_date"]) >= cutoff and amount >= NEW_MERCHANT_MIN_PAISE:
                flags.append(make_flag("new-merchant", r, f"First payment to {r['merchant']}; {rs(amount)} is above "
                                       f"the {rs(NEW_MERCHANT_MIN_PAISE)} new-merchant threshold"))
        if r["merchant"]:
            seen.add(r["merchant"])
    return flags


def all_flags(conn, user_id):
    rows = load_rows(conn, user_id)
    return large_flags(rows) + duplicate_flags(rows) + new_merchant_flags(rows)


def decisions(conn, user_id):
    """'type-txnid' -> decision for this user."""
    rows = conn.execute(
        "SELECT d.flag_type, d.transaction_id, d.decision, d.decided_at FROM flag_decisions d"
        " JOIN transactions t ON t.id = d.transaction_id JOIN accounts a ON a.id = t.account_id WHERE a.user_id = ?",
        (user_id,)).fetchall()
    return {f"{r['flag_type']}-{r['transaction_id']}": r for r in rows}


def flags_payload(conn, user_id):
    """Open flags (no decision yet) and resolved ones (with the user's decision)."""
    made = decisions(conn, user_id)
    open_, resolved = [], []
    for f in all_flags(conn, user_id):
        d = made.get(f["id"])
        if d is None:
            open_.append(f)
        else:
            resolved.append({**f, "decision": d["decision"], "decidedAt": d["decided_at"]})
    return {"flags": open_, "resolved": resolved, "openCount": len(open_)}


def decide(conn, user_id, flag_id, decision):
    """Remember a decision. Confirming a duplicate also stops it counting as spending. None = unknown flag."""
    flag = next((f for f in all_flags(conn, user_id) if f["id"] == flag_id), None)
    if flag is None or decision not in DECISIONS:
        return None
    conn.execute("INSERT INTO flag_decisions (transaction_id, flag_type, decision) VALUES (?, ?, ?)"
                 " ON CONFLICT (transaction_id, flag_type) DO UPDATE SET decision = excluded.decision,"
                 " decided_at = CURRENT_TIMESTAMP", (flag["transactionId"], flag["type"], decision))
    if flag["type"] == "duplicate":
        kind = "duplicate" if decision == "confirmed" else "normal"
        conn.execute("UPDATE transactions SET kind = ? WHERE id = ?", (kind, flag["transactionId"]))
    return {**flag, "decision": decision}


def undo_decision(conn, user_id, flag_id):
    """Forget a decision so the flag is open again."""
    kind, _, txn_id = flag_id.rpartition("-")
    if flag_id not in decisions(conn, user_id):
        return False
    conn.execute("DELETE FROM flag_decisions WHERE transaction_id = ? AND flag_type = ?", (int(txn_id), kind))
    if kind == "duplicate":
        conn.execute("UPDATE transactions SET kind = 'normal' WHERE id = ? AND kind = 'duplicate'", (int(txn_id),))
    return True
