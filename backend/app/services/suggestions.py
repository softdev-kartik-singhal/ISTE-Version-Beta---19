"""Suggestions for you: profile -> (cache) -> AI -> safety checks -> or the rule-based fallback."""
import hashlib
import json
import sqlite3

from app.services import suggest_ai
from app.services.suggest_profile import ABOUT_CHOICES, ABOUT_YES_NO, build_profile
from app.services.suggest_rules import rule_based, validate

DISCLAIMER = ("Educational suggestions of product types, not advice on specific products. For personal advice, consult a "
              "SEBI-registered investment adviser or IRDAI-licensed insurance adviser.")
PRIVACY_NOTE = "No amounts, transactions, account details or your name were shared."


def load_about(conn, user_id):
    row = conn.execute("SELECT * FROM suggestion_about WHERE user_id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


def save_about(conn, user_id, answers):
    """Keep only valid choices; an empty answer clears that field."""
    values = {f: (answers.get(f) if answers.get(f) in c else None) for f, c in ABOUT_CHOICES.items()}
    values.update({f: (int(answers[f]) if isinstance(answers.get(f), bool) else None) for f in ABOUT_YES_NO})
    conn.execute("INSERT INTO suggestion_about (user_id, age_band, dependents, risk_comfort, employer_health_cover, has_daughter)"
                 " VALUES (:u, :age_band, :dependents, :risk_comfort, :employer_health_cover, :has_daughter)"
                 " ON CONFLICT(user_id) DO UPDATE SET age_band = :age_band, dependents = :dependents, risk_comfort = :risk_comfort,"
                 " employer_health_cover = :employer_health_cover, has_daughter = :has_daughter", {"u": user_id, **values})
    conn.commit()


def profile_hash(profile):
    return hashlib.sha256(json.dumps(profile, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def cached(conn, key):
    row = conn.execute("SELECT result_json FROM suggestion_cache WHERE profile_hash = ?", (key,)).fetchone()
    return json.loads(row["result_json"]) if row else None


def remember(conn, key, suggestions):
    conn.execute("INSERT OR REPLACE INTO suggestion_cache (profile_hash, result_json) VALUES (?, ?)", (key, json.dumps(suggestions)))
    conn.commit()


def get_suggestions(conn, ledger, inp, goals, user_id, refresh=False):
    """POST /api/suggestions payload. `profile` is exactly what is (or would be) sent to the AI."""
    if len(inp.history_months) < 1:
        return {"insufficientHistory": True}
    profile = build_profile(ledger, inp, goals, load_about(conn, user_id))
    key = profile_hash(profile)
    out = {"insufficientHistory": False, "profile": profile, "disclaimer": DISCLAIMER, "privacyNote": PRIVACY_NOTE}
    hit = None if refresh else cached(conn, key)
    if hit:
        return {**out, "source": "ai", "cached": True, "sharedWithAI": False, "suggestions": hit}
    try:
        answer = suggest_ai.ask_ai(profile)  # the one and only place data leaves, and it is just `profile`
        shared = True
        suggestions = validate(answer, profile)
    except suggest_ai.AIUnavailable:
        shared, suggestions = False, []
    if suggestions:
        remember(conn, key, suggestions)
        return {**out, "source": "ai", "cached": False, "sharedWithAI": shared, "suggestions": suggestions}
    return {**out, "source": "rules", "cached": False, "sharedWithAI": shared, "note": "Suggestions based on simple rules",
            "suggestions": rule_based(profile)}
