"""Money flow for a Sankey chart: income source -> account -> category -> top-N merchants.

Transfers between own accounts are not in the ledger (kind != normal), so they never appear.
"""
from collections import defaultdict
from statistics import median

from app.services.cash import label
from app.config import (CONCENTRATION_HIGH_PCT, FIXED_CATEGORIES, INSIGHT_MIN_MONTHS, MONEY_FLOW_TOP_N,
                        TREND_BASELINE_MONTHS)
from app.services.insights import rs
from app.services.stats import add_months


def build_graph(rows, top_n):
    """Nodes (column 0..3) and links for one month's rows. Only the top_n merchants by spend are drawn."""
    merchants = defaultdict(int)
    for r in rows:
        if r["amount_paise"] < 0:
            merchants[r["merchant"]] += -r["amount_paise"]
    keep = {m for m, _ in sorted(merchants.items(), key=lambda kv: -kv[1])[:top_n]}
    nodes, links = {}, defaultdict(int)

    def node(node_id, column, name, amount):
        nodes.setdefault(node_id, {"id": node_id, "column": column, "name": name, "amountPaise": 0})
        nodes[node_id]["amountPaise"] += amount

    for r in rows:
        amount, acct = abs(r["amount_paise"]), f"acct:{r['bank']}-{r['last4']}"
        if r["amount_paise"] > 0:
            src = f"src:{r['merchant']}"
            node(src, 0, r["merchant"], amount)
            links[(src, acct)] += amount
        else:
            cat = f"cat:{r['category']}"
            node(cat, 2, r["category"], amount)
            links[(acct, cat)] += amount
            if r["merchant"] in keep:
                node(f"mer:{r['merchant']}", 3, r["merchant"], amount)
                links[(cat, f"mer:{r['merchant']}")] += amount
        node(acct, 1, label(r["bank"], r["last4"]), 0)
    for acct_id in [n for n in nodes if n.startswith("acct:")]:  # an account's size = money through it
        nodes[acct_id]["amountPaise"] = sum(v for (a, b), v in links.items() if b == acct_id)
    return list(nodes.values()), [{"from": a, "to": b, "valuePaise": v} for (a, b), v in links.items()]


def category_detail(ledger, months, month, category, compare):
    """Everything about one category this month vs its baseline (previous month or 3-month median)."""
    idx = months.index(month)
    earlier = months[max(0, idx - TREND_BASELINE_MONTHS):idx]
    baseline_months = earlier[-1:] if compare == "prev" else earlier
    needed = 1 if compare == "prev" else TREND_BASELINE_MONTHS
    rows = [r for r in ledger if r["category"] == category and r["amount_paise"] < 0]
    this = [r for r in rows if r["month"] == month]
    total = sum(-r["amount_paise"] for r in this)
    per_month = lambda m: sum(-r["amount_paise"] for r in rows if r["month"] == m)
    base_total = median([per_month(m) for m in baseline_months]) if len(baseline_months) >= needed else None
    detail = {"name": category, "amountPaise": total, "transactionCount": len(this), "compare": compare,
              "baselinePaise": None if base_total is None else int(base_total),
              "changePct": None if not base_total else round((total / base_total - 1) * 100, 1),
              "insufficientHistory": len(baseline_months) < needed,
              "trajectory": [{"month": m, "amountPaise": per_month(m)} for m in months[max(0, idx - 5):idx + 1]]}
    detail["connectedAccounts"] = connected_accounts(this, total)
    detail["drivers"] = drivers(rows, this, baseline_months, total, base_total, needed)
    detail["concentration"] = concentration(this, total)
    seen_before = {r["merchant"] for r in rows if r["month"] < month}
    detail["newMerchants"] = sorted({r["merchant"] for r in this if r["merchant"] not in seen_before})
    return detail


def connected_accounts(this, total):
    by = defaultdict(int)
    for r in this:
        by[label(r["bank"], r["last4"])] += -r["amount_paise"]
    return [{"account": a, "sharePct": round(v * 100 / total)} for a, v in sorted(by.items(), key=lambda kv: -kv[1])] if total else []


def drivers(rows, this, baseline_months, total, base_total, needed):
    """Merchants ranked by how much of the change they explain. contribution % = share of the same-direction change."""
    if base_total is None or len(baseline_months) < needed:
        return []
    now, base = defaultdict(int), defaultdict(list)
    for r in this:
        now[r["merchant"]] += -r["amount_paise"]
    for m in baseline_months:
        for merchant in {r["merchant"] for r in rows}:
            base[merchant].append(sum(-r["amount_paise"] for r in rows if r["month"] == m and r["merchant"] == merchant))
    delta = {m: now.get(m, 0) - median(base[m]) for m in set(now) | set(base)}
    rising = total >= base_total
    side = {m: d for m, d in delta.items() if (d > 0 if rising else d < 0)}
    whole = sum(side.values())
    out = [{"merchant": m, "deltaPaise": int(d), "contributionPct": round(d * 100 / whole) if whole else 0,
            "transactions": sum(r["merchant"] == m for r in this)}
           for m, d in sorted(side.items(), key=lambda kv: -abs(kv[1]))[:3]]
    return out


def concentration(this, total):
    """Share of the category held by its top-3 merchants, with a plain tip when one dominates."""
    by = defaultdict(int)
    for r in this:
        by[r["merchant"]] += -r["amount_paise"]
    top = sorted(by.items(), key=lambda kv: -kv[1])[:3]
    parts = [{"merchant": m, "sharePct": round(v * 100 / total)} for m, v in top] if total else []
    tip = None
    if parts and parts[0]["sharePct"] >= CONCENTRATION_HIGH_PCT:
        tip = f"{parts[0]['merchant']} is {parts[0]['sharePct']}% of this category ({rs(top[0][1])}); it is the one to look at."
    return {"top3SharePct": sum(p["sharePct"] for p in parts), "parts": parts, "tip": tip}


def money_flow(ledger, inp, month=None, compare="median", top_n=MONEY_FLOW_TOP_N, category=None):
    """GET /api/money-flow payload. Raises ValueError for a month outside the complete history."""
    months = list(inp.history_months)
    if not months:
        return {"insufficientHistory": True, "monthsAvailable": 0, "nodes": [], "links": []}
    month = month or months[-1]
    if month not in months:
        raise ValueError(f"Month must be one of: {', '.join(months)}.")
    rows = [r for r in ledger if r["month"] == month]
    nodes, links = build_graph(rows, top_n)
    spend = defaultdict(int)
    for r in rows:
        if r["amount_paise"] < 0:
            spend[r["category"]] += -r["amount_paise"]
    if category is None and spend:  # default: the biggest category that is not a fixed cost
        flexible = {c: v for c, v in spend.items() if c not in FIXED_CATEGORIES} or spend
        category = max(flexible, key=flexible.get)
    if category is not None and category not in spend:
        raise ValueError(f"No {category} spending in {month}.")
    return {"month": month, "months": months, "compare": compare, "topN": top_n, "nodes": nodes, "links": links,
            "incomePaise": sum(n["amountPaise"] for n in nodes if n["column"] == 0),
            "spendPaise": sum(spend.values()),
            "insufficientHistory": months.index(month) < INSIGHT_MIN_MONTHS - 1 if compare == "median" else months.index(month) < 1,
            "selectedCategory": category_detail(ledger, months, month, category, compare) if category else None}
