"""Question parser: regexes only, no LLM. It extracts an amount and a month and hands them
back for the user to confirm; nothing is calculated from the raw sentence."""
import re

from app.services.stats import add_months, month_of

MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
# Number, optional currency before it, optional multiplier after it. Numbers followed by a
# time word ("3 months", "12 EMIs") are not money.
AMOUNT = re.compile(r"(?P<cur>₹|rs\.?|inr)?\s*(?P<num>\d[\d,]*(?:\.\d+)?)\s*(?P<mult>k|thousand|lakhs?|lacs?|l|crores?|cr)?\b"
                    r"(?!\s*(?:months?|days?|weeks?|years?|emis?|%))", re.I)
MULTIPLIER = {"k": 1_000, "thousand": 1_000, "l": 100_000, "lakh": 100_000, "lakhs": 100_000, "lac": 100_000,
              "lacs": 100_000, "cr": 10_000_000, "crore": 10_000_000, "crores": 10_000_000}
MONTH_NAME = re.compile(r"\b(?:in|by|for|during|on|of)\s+(" + "|".join(MONTHS) + r")[a-z]*\b(?:\s+(\d{4}))?", re.I)
IN_N_MONTHS = re.compile(r"\bin\s+(\d{1,2})\s+months?\b", re.I)


def find_amounts(text):
    """Every money amount in the text, as (matched text, paise). A bare number counts only if >= 1,000
    and does not look like a year."""
    found = []
    for m in AMOUNT.finditer(text):
        raw, mult = m.group("num").replace(",", ""), (m.group("mult") or "").lower()
        has_marker = bool(m.group("cur") or mult)
        value = float(raw) * MULTIPLIER.get(mult, 1)
        if not has_marker and (value < 1000 or (re.fullmatch(r"(19|20)\d\d", raw) and "," not in m.group("num"))):
            continue
        found.append((m.group(0).strip(), int(round(value * 100))))
    return found


def find_month(text, as_of_month):
    """(matched text, 'YYYY-MM') or None. Months are always in the future relative to the statements."""
    if re.search(r"\bnext\s+month\b", text, re.I):
        return "next month", add_months(as_of_month, 1)
    n = IN_N_MONTHS.search(text)
    if n:
        return n.group(0), add_months(as_of_month, int(n.group(1)))
    m = MONTH_NAME.search(text)
    if m:
        number = MONTHS.index(m.group(1).lower()[:3]) + 1
        year = int(m.group(2)) if m.group(2) else int(as_of_month[:4]) + (number <= int(as_of_month[5:]))
        return m.group(0), f"{year:04d}-{number:02d}"
    return None


def parse_question(text, as_of):
    """Return what was understood and what is still missing. The caller must get the user's confirmation."""
    amounts = find_amounts(text)
    month = find_month(text, month_of(as_of))
    missing = []
    if len(amounts) != 1:
        missing.append("amount")
    if month is None:
        missing.append("month")
    return {"amountPaise": amounts[0][1] if len(amounts) == 1 else None,
            "amountText": amounts[0][0] if len(amounts) == 1 else None,
            "amountCandidates": [{"text": t, "paise": p} for t, p in amounts] if len(amounts) > 1 else [],
            "targetMonth": month[1] if month else None, "monthText": month[0] if month else None,
            "missing": missing}
