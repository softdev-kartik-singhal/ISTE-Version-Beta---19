"""Gather everything the affordability calculation needs from the database, and check there is enough of it."""
from collections import defaultdict
from dataclasses import dataclass
from datetime import date

from app.config import (MIN_HISTORY_MONTHS, MONTH_EDGE_SLACK_DAYS, VARIABLE_HIGH_PCT, VARIABLE_LOW_PCT,
                        VARIABLE_MONTHS)
from app.services.income import classify_income, income_profile, monthly_income
from app.services.stats import add_months, month_end, month_of, months_between, percentile
from app.services.summary import coverage


@dataclass(frozen=True)
class Inputs:
    """All inputs of the calculation. The calculation is a pure function of this, so a what-if is
    just the same function on a modified copy (dataclasses.replace)."""
    as_of: date                # date of the latest transaction
    start_cash: int            # sum of each account's latest balance, paise
    history_months: tuple      # complete months used, 'YYYY-MM'
    monthly_income: tuple      # income per history month, one-offs excluded
    profile: dict              # income classes, for the response
    one_offs: tuple            # [{merchant, date, paise}]
    recurring: tuple           # money-out recurring items (dicts)
    variable: dict             # category -> {"low", "median", "high"} monthly paise
    gaps: tuple                # [{bank, last4, from, to, days}]
    has_balance: bool


def history_months(first, last):
    """Months fully covered by the statements (edge months only if the data reaches near their edges)."""
    out = []
    for m in months_between(month_of(first), month_of(last)):
        starts_late = m == month_of(first) and first.day > MONTH_EDGE_SLACK_DAYS
        ends_early = m == month_of(last) and (month_end(m) - last).days > MONTH_EDGE_SLACK_DAYS
        if not (starts_late or ends_early):
            out.append(m)
    return out


def variable_spend(rows, months, recurring_merchants):
    """Per category: P25 / median / P75 of its monthly total over `months` (recurring payments excluded,
    since those are counted as committed)."""
    sums = defaultdict(lambda: dict.fromkeys(months, 0))
    for r in rows:
        if r["amount_paise"] < 0 and r["kind"] == "normal" and r["merchant"] not in recurring_merchants \
                and month_of(r["txn_date"]) in months:
            sums[r["category"] or "Other"][month_of(r["txn_date"])] += -r["amount_paise"]
    return {cat: {"low": round(percentile(list(m.values()), VARIABLE_LOW_PCT)),
                  "median": round(percentile(list(m.values()), 50)),
                  "high": round(percentile(list(m.values()), VARIABLE_HIGH_PCT))} for cat, m in sums.items()}


def latest_balances(conn, user_id):
    """Each account's most recent balance in paise (accounts with no balance column are skipped)."""
    rows = conn.execute(
        "SELECT t.balance_paise FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE a.user_id = ?"
        " AND t.id = (SELECT id FROM transactions WHERE account_id = a.id ORDER BY txn_date DESC, id DESC LIMIT 1)",
        (user_id,)).fetchall()
    return [r["balance_paise"] for r in rows if r["balance_paise"] is not None]


def build_inputs(conn, user_id):
    rows = conn.execute(
        "SELECT t.id, t.txn_date, t.amount_paise, t.merchant, t.kind, c.name AS category FROM transactions t"
        " JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id"
        " WHERE a.user_id = ?", (user_id,)).fetchall()
    recurring = [dict(r) for r in conn.execute("SELECT * FROM recurring WHERE user_id = ?", (user_id,))]
    gaps = [{**g, "bank": a["bank"], "last4": a["last4"]} for a in coverage(conn, user_id)["accounts"] for g in a["gaps"]]
    balances = latest_balances(conn, user_id)
    if not rows:
        return Inputs(date.today(), 0, (), (), income_profile({"regular": [], "irregular": [], "one_off": []}, {}),
                      (), (), {}, tuple(gaps), False)
    days = [date.fromisoformat(r["txn_date"]) for r in rows]
    months = history_months(min(days), max(days))
    credits = [dict(r) for r in rows if r["amount_paise"] > 0 and r["kind"] == "normal" and r["merchant"]]
    classes = classify_income(credits, recurring)
    totals = monthly_income(classes, months)
    debits = [r for r in recurring if r["typical_paise"] < 0]
    last_months = months[-VARIABLE_MONTHS:]
    return Inputs(max(days), sum(balances), tuple(months), tuple(totals.values()), income_profile(classes, totals),
                  tuple({"merchant": c["merchant"], "date": c["txn_date"], "paise": c["amount_paise"]}
                        for c in classes["one_off"]),
                  tuple(debits), variable_spend(rows, last_months, {r["merchant"] for r in debits}), tuple(gaps),
                  bool(balances))


def missing_items(inp):
    """Everything that stops us forecasting, each with a plain explanation. Empty list = enough data."""
    missing = []
    if len(inp.history_months) < MIN_HISTORY_MONTHS:
        missing.append({"code": "HISTORY", "message": f"Need at least {MIN_HISTORY_MONTHS} complete months of "
                        f"statements; found {len(inp.history_months)}."})
    if not any(inp.monthly_income):
        missing.append({"code": "INCOME", "message": "No income found. Upload a statement that shows your salary or other credits."})
    if not inp.has_balance:
        missing.append({"code": "BALANCE", "message": "The statements carry no account balance, so cash in hand is unknown."})
    for g in inp.gaps:
        missing.append({"code": "GAP", "message": f"{g['bank']} ••{g['last4']} has no data between {g['from']} and "
                        f"{g['to']} ({g['days']} days). Upload the statement that covers it.", **g})
    return missing
