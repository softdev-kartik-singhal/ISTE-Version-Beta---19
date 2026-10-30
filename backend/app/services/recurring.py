"""Recurring payment detection: same merchant, similar amount, regular gaps, seen >= 3 times."""
from collections import defaultdict
from datetime import date, timedelta
from statistics import median

from app.config import (RECURRING_AMOUNT_TOLERANCE, RECURRING_CADENCES, RECURRING_MIN_GAP_SHARE,
                        RECURRING_MIN_OCCURRENCES)

# Category -> label stored in the recurring table; anything else is 'other' (money out) or 'income'.
LABELS = {"Salary": "salary", "Rent": "rent", "EMI": "emi", "Subscriptions": "subscription", "Bills & Utilities": "bill"}


def cluster_by_amount(rows):
    """Group rows whose amounts sit within +/-5% of each other (cluster spans at most smallest x 1.10)."""
    clusters = []
    for r in sorted(rows, key=lambda r: abs(r["amount_paise"])):
        limit = 1 + 2 * RECURRING_AMOUNT_TOLERANCE
        if clusters and abs(r["amount_paise"]) <= abs(clusters[-1][0]["amount_paise"]) * limit:
            clusters[-1].append(r)
        else:
            clusters.append([r])
    return clusters


def cadence_of(days):
    """7, 30 or 365 if enough of the gaps between sorted dates fit it, else None."""
    gaps = [(b - a).days for a, b in zip(days, days[1:])]
    for nominal, slack in RECURRING_CADENCES.items():
        fits = sum(abs(g - nominal) <= slack for g in gaps)
        if abs(median(gaps) - nominal) <= slack and fits >= RECURRING_MIN_GAP_SHARE * len(gaps):
            return nominal
    return None


def detect(rows):
    """rows: dicts with merchant, txn_date, amount_paise, category. Returns recurring items (dicts)."""
    by_merchant = defaultdict(list)
    for r in rows:
        if r["merchant"]:
            by_merchant[(r["merchant"], r["amount_paise"] > 0)].append(r)  # money in and out kept apart
    items = []
    for (merchant, is_income), group in by_merchant.items():
        for cluster in cluster_by_amount(group):
            if len(cluster) < RECURRING_MIN_OCCURRENCES:
                continue
            cluster.sort(key=lambda r: (r["txn_date"], r["id"]))
            days = [date.fromisoformat(r["txn_date"]) for r in cluster]
            cadence = cadence_of(days)
            if cadence is None:
                continue
            fallback = "income" if is_income else "other"
            items.append({"merchant": merchant, "label": LABELS.get(cluster[-1]["category"], fallback),
                          "typical_paise": int(median(r["amount_paise"] for r in cluster)),
                          "cadence_days": cadence, "occurrences": len(cluster), "last_seen": days[-1].isoformat(),
                          "next_expected": (days[-1] + timedelta(days=cadence)).isoformat()})
    return sorted(items, key=lambda i: i["next_expected"])


def refresh_recurring(conn, user_id):
    """Recompute the user's recurring list from their transactions (it is derived data, so rebuild it)."""
    rows = conn.execute(
        "SELECT t.id, t.merchant, t.txn_date, t.amount_paise, c.name AS category FROM transactions t"
        " JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
        " WHERE a.user_id = ? AND t.kind = 'normal'", (user_id,)).fetchall()
    conn.execute("DELETE FROM recurring WHERE user_id = ?", (user_id,))
    for i in detect(rows):
        conn.execute("INSERT INTO recurring (user_id, merchant, label, typical_paise, cadence_days, occurrences,"
                     " last_seen, next_expected) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                     (user_id, i["merchant"], i["label"], i["typical_paise"], i["cadence_days"], i["occurrences"],
                      i["last_seen"], i["next_expected"]))
