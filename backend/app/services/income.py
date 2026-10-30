"""Income classification: regular, irregular or one-off."""
from collections import defaultdict
from statistics import median

from app.config import ONE_OFF_MAX_OCCURRENCES, ONE_OFF_MIN_PAISE, ONE_OFF_MIN_SHARE
from app.services.stats import month_of


def classify_income(credits, recurring):
    """Split credits (dicts: merchant, txn_date, amount_paise) into three groups.

    regular   - a source that follows a recurring pattern (e.g. salary on the 28th)
    one-off   - seen once, not recurring, and big (a bonus): left out of the forecast
    irregular - everything else (e.g. freelance payments at random times)
    """
    regular_sources = {r["merchant"]: r["typical_paise"] for r in recurring if r["typical_paise"] > 0}
    regular_monthly = sum(regular_sources.values())
    big = max(ONE_OFF_MIN_SHARE * regular_monthly, ONE_OFF_MIN_PAISE)
    by_source = defaultdict(list)
    for c in credits:
        by_source[c["merchant"]].append(c)
    out = {"regular": [], "irregular": [], "one_off": []}
    for merchant, rows in by_source.items():
        if merchant in regular_sources:
            kind = "regular"
        elif len(rows) <= ONE_OFF_MAX_OCCURRENCES and rows[0]["amount_paise"] >= big:
            kind = "one_off"
        else:
            kind = "irregular"
        out[kind] += [{**r, "merchant": merchant} for r in rows]
    return out


def monthly_income(classes, months):
    """Income per history month, one-offs excluded. Months with no income count as 0."""
    totals = dict.fromkeys(months, 0)
    for kind in ("regular", "irregular"):
        for c in classes[kind]:
            if month_of(c["txn_date"]) in totals:
                totals[month_of(c["txn_date"])] += c["amount_paise"]
    return totals


def income_profile(classes, totals):
    """Summary of the classes for the API response."""
    def group(kind):
        by = defaultdict(list)
        for c in classes[kind]:
            by[c["merchant"]].append(c["amount_paise"])
        return [{"merchant": m, "occurrences": len(v), "totalPaise": sum(v), "medianPaise": int(median(v))}
                for m, v in sorted(by.items())]
    return {"regular": group("regular"), "irregular": group("irregular"),
            "oneOff": [{"merchant": c["merchant"], "date": c["txn_date"], "paise": c["amount_paise"]}
                       for c in classes["one_off"]],
            "monthlyPaise": totals}
