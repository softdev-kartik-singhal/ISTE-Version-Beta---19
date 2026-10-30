"""Own-account transfer matching.

Think of a graph: each unmatched debit is a node on the left, each unmatched credit
a node on the right, and an edge joins a debit to a credit when
  - they are in DIFFERENT accounts of the same user,
  - the amounts are equal, and
  - the dates are at most TRANSFER_MATCH_DAYS apart.
We then pick edges so every row is used at most once, closest dates first.
"""
from collections import defaultdict
from datetime import date

from app.config import TRANSFER_MATCH_DAYS


def day_gap(a, b):
    return abs((date.fromisoformat(a) - date.fromisoformat(b)).days)


def candidate_edges(rows):
    """All (day gap, debit id, credit id) pairs that satisfy the rules above."""
    credits_by_amount = defaultdict(list)
    for r in rows:
        if r["amount_paise"] > 0:
            credits_by_amount[r["amount_paise"]].append(r)
    edges = []
    for d in rows:
        if d["amount_paise"] >= 0:
            continue
        for c in credits_by_amount.get(-d["amount_paise"], []):
            gap = day_gap(d["txn_date"], c["txn_date"])
            if c["account_id"] != d["account_id"] and gap <= TRANSFER_MATCH_DAYS:
                edges.append((gap, d["id"], c["id"]))
    return edges


def pick_matches(edges):
    """Greedy one-to-one choice: smallest date gap first, each row used once. Ties break by id (deterministic)."""
    used, pairs = set(), []
    for gap, debit, credit in sorted(edges):
        if debit not in used and credit not in used:
            used.update((debit, credit))
            pairs.append((debit, credit))
    return pairs


def match_transfers(conn, user_id):
    """Mark matched rows kind='transfer' + category Transfer. Safe to re-run. Returns pairs matched now."""
    rows = conn.execute(
        "SELECT t.id, t.account_id, t.txn_date, t.amount_paise FROM transactions t"
        " JOIN accounts a ON a.id = t.account_id WHERE a.user_id = ? AND t.kind = 'normal'", (user_id,)).fetchall()
    pairs = pick_matches(candidate_edges(rows))
    category = conn.execute("SELECT id FROM categories WHERE name = 'Transfer'").fetchone()["id"]
    for debit, credit in pairs:
        conn.execute("UPDATE transactions SET kind = 'transfer', category_id = ? WHERE id IN (?, ?)",
                     (category, debit, credit))
    return len(pairs)
