"""Trust: a tamper-evident forecast log, a backtest that uses only earlier data, and the track record.

What is forecast: next month's SURPLUS (income - committed - variable spend), as three numbers:
worst, typical and best (the same cases the affordability answer uses). What happened is the
month's actual surplus with one-off income removed, matching how the forecast treats income.
"""
import hashlib
import json
from statistics import mean

from app.config import TRACK_RECORD_MIN_MONTHS
from app.services.affordability import monthly_surplus_forecast
from app.services.forecast import build_inputs, missing_items
from app.services.insights import load_ledger, monthly_series
from app.services.stats import add_months, month_end, month_of, months_between

GENESIS = "0" * 64  # prev_hash of a user's first entry
FIELDS = ("kind", "source", "made_on", "target_month", "worst_paise", "typical_paise", "best_paise", "actual_paise")


# ---------- the hash chain ----------

def compute_hash(prev_hash, user_id, entry):
    """SHA-256 of the previous hash followed by this entry's fields in one fixed text form."""
    body = json.dumps({"user_id": user_id, **{f: entry[f] for f in FIELDS}}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256((prev_hash + body).encode()).hexdigest()


def last_hash(conn, user_id):
    row = conn.execute("SELECT entry_hash FROM forecast_log WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,)).fetchone()
    return row["entry_hash"] if row else GENESIS


def append_entry(conn, user_id, **fields):
    """Add one entry at the end of the user's chain. Fields not given are NULL."""
    entry = {f: fields.get(f) for f in FIELDS}
    prev = last_hash(conn, user_id)
    digest = compute_hash(prev, user_id, entry)
    conn.execute("INSERT INTO forecast_log (user_id, kind, source, made_on, target_month, worst_paise, typical_paise,"
                 " best_paise, actual_paise, prev_hash, entry_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                 (user_id, *[entry[f] for f in FIELDS], prev, digest))
    return digest


def verify_chain(conn, user_id):
    """Walk the chain from the start. Reports the FIRST entry whose link or content does not check out."""
    rows = conn.execute("SELECT * FROM forecast_log WHERE user_id = ? ORDER BY id", (user_id,)).fetchall()
    prev = GENESIS
    for position, row in enumerate(rows, start=1):
        problem = None
        if row["prev_hash"] != prev:
            problem = "Link broken: this entry does not follow the one before it (an entry was removed, added or reordered)."
        elif compute_hash(prev, user_id, row) != row["entry_hash"]:
            problem = "Content changed: this entry no longer matches its hash."
        if problem:
            return {"valid": False, "entries": len(rows), "headHash": None,
                    "firstBrokenLink": {"entryId": row["id"], "position": position, "targetMonth": row["target_month"],
                                        "kind": row["kind"], "reason": problem}}
        prev = row["entry_hash"]
    return {"valid": True, "entries": len(rows), "headHash": prev if rows else None, "firstBrokenLink": None}


# ---------- what actually happened ----------

def actual_surplus_by_month(ledger, inp):
    """Month -> surplus with one-off income removed (the forecast never expects a bonus)."""
    return {m["month"]: m["surplusPaise"] - m["oneOffPaise"] for m in monthly_series(ledger, inp)}


def gap_months(inp):
    """Months touched by a coverage gap: their 'actual' would be understated, so they are not judged."""
    return {m for g in inp.gaps for m in months_between(month_of(g["from"]), month_of(g["to"]))}


def logged_months(conn, user_id, kind):
    return {r["target_month"] for r in conn.execute(
        "SELECT target_month FROM forecast_log WHERE user_id = ? AND kind = ?", (user_id, kind))}


# ---------- backtest ----------

def backtest(conn, user_id):
    """For every complete past month, forecast it from the data BEFORE it, then compare with what happened.

    Each forecast/actual pair is appended to the log (months already logged are skipped).
    """
    full = build_inputs(conn, user_id)
    actual = actual_surplus_by_month(load_ledger(conn, user_id), full)
    blocked, done = gap_months(full), logged_months(conn, user_id, "forecast")
    judged, skipped = [], []
    for month in full.history_months:
        reason = skip_reason(month, done, blocked)
        until = month_end(add_months(month, -1)).isoformat()
        inp = None if reason else build_inputs(conn, user_id, until=until)
        if inp is not None:
            missing = missing_items(inp)
            reason = missing[0]["message"] if missing else (
                None if month_of(inp.as_of) == add_months(month, -1) else "No statement data in the month before.")
        if reason:
            skipped.append({"month": month, "reason": reason})
            continue
        fc = monthly_surplus_forecast(inp, month)
        append_entry(conn, user_id, kind="forecast", source="backtest", made_on=until, target_month=month,
                     worst_paise=fc["worst"], typical_paise=fc["typical"], best_paise=fc["best"])
        append_entry(conn, user_id, kind="actual", source="backtest", made_on=month_end(month).isoformat(),
                     target_month=month, actual_paise=actual[month])
        judged.append({"month": month, "forecast": fc, "actualPaise": actual[month]})
    conn.commit()
    return {"added": judged, "skipped": skipped}


def skip_reason(month, done, blocked):
    if month in done:
        return "Already in the log."
    if month in blocked:
        return "The statements have a gap in this month, so what really happened is unknown."
    return None


# ---------- live forecasts ----------

def log_live_forecast(conn, user_id):
    """Record a forecast for the month after the latest statement. Refuses if the data is not enough."""
    inp = build_inputs(conn, user_id)
    missing = missing_items(inp)
    if missing:
        return {"status": "insufficient_data", "missing": missing}
    target = add_months(month_of(inp.as_of), 1)
    if target in logged_months(conn, user_id, "forecast"):
        return {"status": "already_logged", "targetMonth": target}
    fc = monthly_surplus_forecast(inp, target)
    append_entry(conn, user_id, kind="forecast", source="live", made_on=inp.as_of.isoformat(), target_month=target,
                 worst_paise=fc["worst"], typical_paise=fc["typical"], best_paise=fc["best"])
    conn.commit()
    return {"status": "logged", "targetMonth": target, "forecast": fc}


def settle(conn, user_id):
    """Add the actual for every logged forecast whose month is now complete in the statements."""
    full = build_inputs(conn, user_id)
    actual = actual_surplus_by_month(load_ledger(conn, user_id), full)
    open_months = logged_months(conn, user_id, "forecast") - logged_months(conn, user_id, "actual")
    settled = []
    for month in sorted(open_months):
        if month in actual and month not in gap_months(full):
            append_entry(conn, user_id, kind="actual", source="live", made_on=full.as_of.isoformat(),
                         target_month=month, actual_paise=actual[month])
            settled.append({"month": month, "actualPaise": actual[month]})
    conn.commit()
    return {"settled": settled, "stillWaiting": sorted(open_months - {s["month"] for s in settled})}


# ---------- track record ----------

def judge(forecast, actual):
    """One month's verdict: did reality land inside the worst-best band, and how far from the middle?"""
    a = actual["actual_paise"]
    return {"month": forecast["target_month"], "source": forecast["source"], "worstPaise": forecast["worst_paise"],
            "typicalPaise": forecast["typical_paise"], "bestPaise": forecast["best_paise"], "actualPaise": a,
            "hit": forecast["worst_paise"] <= a <= forecast["best_paise"],
            "worstCaseHeld": a >= forecast["worst_paise"], "missPaise": a - forecast["typical_paise"]}


def track_record(conn, user_id):
    """Hit rate, average miss and bias over every month that has both a forecast and an actual."""
    rows = conn.execute("SELECT * FROM forecast_log WHERE user_id = ? ORDER BY id", (user_id,)).fetchall()
    forecasts = {r["target_month"]: r for r in rows if r["kind"] == "forecast"}
    actuals = {r["target_month"]: r for r in rows if r["kind"] == "actual"}
    months = [judge(forecasts[m], actuals[m]) for m in sorted(forecasts) if m in actuals]
    chain = verify_chain(conn, user_id)
    summary = None
    if months:
        summary = {"hitRate": round(sum(m["hit"] for m in months) / len(months), 3),
                   "worstCaseHeldRate": round(sum(m["worstCaseHeld"] for m in months) / len(months), 3),
                   "averageMissPaise": round(mean(abs(m["missPaise"]) for m in months)),
                   "biasPaise": round(mean(m["missPaise"] for m in months))}
    return {"months": months, "judgedMonths": len(months), "enoughToJudge": len(months) >= TRACK_RECORD_MIN_MONTHS,
            "waitingForActual": sorted(set(forecasts) - set(actuals)), "summary": summary,
            "meaning": {"hitRate": "Share of months where the actual surplus landed between the worst and best case.",
                        "worstCaseHeldRate": "Share of months where reality was no worse than the worst case.",
                        "averageMissPaise": "Average distance between the actual surplus and the typical case.",
                        "biasPaise": "Average signed miss: negative = we were too optimistic."},
            "chain": {"valid": chain["valid"], "entries": chain["entries"]}}
