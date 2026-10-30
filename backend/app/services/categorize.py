"""Keyword-rule categorisation. A user's merchant correction beats every rule."""
import re


class Categorizer:
    """Loads rules and the user's remembered corrections once, then categorises many rows."""

    def __init__(self, conn, user_id):
        rules = conn.execute("SELECT pattern, category_id, priority FROM category_rules").fetchall()
        # Highest priority first; among equals the longer (more specific) word first.
        rules.sort(key=lambda r: (-r["priority"], -len(r["pattern"])))
        self.rules = [(re.compile(rf"\b{re.escape(r['pattern'])}\b"), r["category_id"]) for r in rules]
        ids = {r["name"]: r["id"] for r in conn.execute("SELECT id, name FROM categories")}
        self.other, self.other_income = ids["Other"], ids["Other Income"]
        self.overrides = merchant_overrides(conn, user_id)

    def category_for(self, description, merchant, amount_paise):
        """Correction for this merchant -> first matching rule -> Other / Other Income."""
        if merchant in self.overrides:
            return self.overrides[merchant]
        text = description.upper()
        for pattern, category_id in self.rules:
            if pattern.search(text):
                return category_id
        return self.other_income if amount_paise > 0 else self.other


def merchant_overrides(conn, user_id):
    """merchant -> category the user last chose with 'apply to this merchant' (later corrections win)."""
    rows = conn.execute(
        "SELECT t.merchant, c.category_id FROM corrections c JOIN transactions t ON t.id = c.transaction_id"
        " JOIN accounts a ON a.id = t.account_id WHERE a.user_id = ? AND c.applies_to_merchant = 1"
        " AND t.merchant IS NOT NULL ORDER BY c.id", (user_id,)).fetchall()
    return {r["merchant"]: r["category_id"] for r in rows}
