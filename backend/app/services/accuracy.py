"""Categorisation accuracy against the demo data's planted labels, before and after corrections.

The labels (demo_data/*/planted_labels.json) come from the generator and are the TRUE category of each row;
the app's rules never see them. 'After corrections' is simulated on an in-memory COPY of the database,
so the user's real categories are never touched.
"""
import json
import sqlite3
from collections import defaultdict

from app.config import ACCURACY_MAX_STEPS, DEMO_DIR
from app.services.corrections import apply_correction


def load_labels():
    """(last4, date, amount, description, balance) -> true category, from every demo dataset."""
    labels = {}
    for path in sorted(DEMO_DIR.glob("*/planted_labels.json")):
        for r in json.loads(path.read_text())["rows"]:
            labels[(r["last4"], r["date"], r["amountPaise"], r["description"], r["balancePaise"])] = r["category"]
    return labels


def labelled_rows(conn, user_id, labels):
    """The user's transactions that have a planted label, with current and true category."""
    rows = conn.execute(
        "SELECT t.id, t.merchant, t.txn_date, t.amount_paise, t.balance_paise, t.description, a.last4, c.name AS category"
        " FROM transactions t JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
        " WHERE a.user_id = ? ORDER BY t.id", (user_id,)).fetchall()
    out = []
    for r in rows:
        truth = labels.get((r["last4"], r["txn_date"], r["amount_paise"], r["description"], r["balance_paise"]))
        if truth:
            out.append({"id": r["id"], "merchant": r["merchant"], "category": r["category"], "truth": truth})
    return out


def score(rows):
    correct = sum(r["category"] == r["truth"] for r in rows)
    return {"correct": correct, "total": len(rows), "accuracy": round(correct / len(rows), 4) if rows else None}


def wrong_groups(rows):
    """Wrong rows grouped by (merchant, truth): the unit a merchant correction fixes.
    A merchant whose rows have different true categories cannot be fixed by one correction, so it is left out."""
    truths = defaultdict(set)
    for r in rows:
        truths[r["merchant"]].add(r["truth"])
    groups = defaultdict(list)
    for r in rows:
        if r["category"] != r["truth"] and len(truths[r["merchant"]]) == 1:
            groups[(r["merchant"], r["truth"])].append(r)
    return groups


def accuracy_report(conn, user_id):
    """GET /api/categorisation-accuracy payload."""
    labels = load_labels()
    rows = labelled_rows(conn, user_id, labels)
    if not rows:
        return {"labelled": 0, "message": "None of your transactions have a planted label, so accuracy cannot be measured. "
                                           "Load a demo dataset to see this check."}
    before = score(rows)
    copy = sqlite3.connect(":memory:")
    copy.row_factory = sqlite3.Row
    conn.commit()  # a backup waits forever on this connection's open transaction
    conn.backup(copy)  # work on a copy; the real database is never changed
    steps = []
    for _ in range(ACCURACY_MAX_STEPS):
        groups = wrong_groups(labelled_rows(copy, user_id, labels))
        if not groups:
            break
        (merchant, truth), wrong = max(groups.items(), key=lambda kv: len(kv[1]))
        category_id = copy.execute("SELECT id FROM categories WHERE name = ?", (truth,)).fetchone()["id"]
        result = apply_correction(copy, user_id, wrong[0]["id"], category_id, True)
        copy.commit()
        steps.append({"merchant": merchant, "correctedTo": truth, "rowsFixed": len(result["changed"]),
                      "accuracy": score(labelled_rows(copy, user_id, labels))["accuracy"]})
    final = labelled_rows(copy, user_id, labels)
    copy.close()
    return {"labelled": len(rows), "before": before, "after": score(final), "correctionsNeeded": len(steps), "steps": steps,
            "stillWrong": [{"merchant": r["merchant"], "category": r["category"], "truth": r["truth"]}
                           for r in final if r["category"] != r["truth"]][:20]}
