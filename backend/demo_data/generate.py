"""Demo statement generator. Run: python demo_data/generate.py

Builds a ledger per account as (date, narration, signed paise), computes the
running balance, then writes bank-style CSVs. Seeded, so output is identical
every run. Planted cases are listed in README.md and planted_cases.json.
"""
import csv
import json
import random
import sys
from datetime import date, timedelta
from pathlib import Path

SEED = 42
MONTHS = [(2026, m) for m in range(2, 10)]  # Feb..Sep 2026 = 8 months
SHORT_MONTHS = [(2026, 8), (2026, 9)]

# Fake account numbers (parser must mask these to the last 4 digits).
ACCT_A = "50100123451234"   # "HDFC"-style bank
ACCT_B = "7312345678905678"  # "Kotak"-style bank
ACCT_C = "90210055559999"   # bank for the 2-month dataset

GAP_START, GAP_END = date(2026, 8, 11), date(2026, 8, 20)  # 10 days missing in bank B


def rupees(n):
    """Rupees -> integer paise."""
    return int(round(n * 100))


def money(paise):
    """Non-negative paise -> '1234.50' text, as banks print it."""
    return f"{paise // 100}.{paise % 100:02d}"


def with_balances(opening, events):
    """Sort events (date, text, signed paise, true category) by date (stable) and attach the running balance."""
    rows, bal = [], opening
    for day, text, amt, label in sorted(events, key=lambda e: e[0]):
        bal += amt
        rows.append((day, text, amt, bal, label))
    return rows


def upi(rng, merchant):
    """A UPI narration with a random 10-digit reference."""
    return f"UPI/{merchant}/{rng.randint(10**9, 10**10 - 1)}"


def spread(rng, y, m, count, lo, hi, merchants):
    """`count` small spends on random days of the month (days 1-28). merchants = [(name, true category)]."""
    out = []
    for _ in range(count):
        day = rng.randint(1, 28)
        name, label = rng.choice(merchants)
        out.append((date(y, m, day), upi(rng, name), -rupees(rng.randint(lo, hi)), label))
    return out


def bank_a_events(rng):
    """Salary account: salary, rent, EMI, bills, groceries, transfers out."""
    ev = []
    for y, m in MONTHS:
        ev += [
            (date(y, m, 1), "UPI/RENT/MR SHARMA LANDLORD", -rupees(28000), "Rent"),
            (date(y, m, 3), "NEFT/SELF TRANSFER TO KOTAK 5678", -rupees(20000), "Transfer"),   # own-account transfer
            (date(y, m, 7), "ACH D-HDFC LTD-EMI-LN00482", -rupees(14500), "EMI"),
            (date(y, m, 28), "NEFT CR-ACME TECH PVT LTD-SALARY", rupees(95000), "Salary"),
            (date(y, m, rng.randint(10, 16)), "BESCOM ELECTRICITY BILL", -rupees(rng.randint(1400, 2600)), "Bills & Utilities"),
        ]
        ev += spread(rng, y, m, 3, 800, 2200, [("BIGBASKET", "Groceries"), ("DMART", "Groceries")])
    ev.append((date(2026, 2, 14), "NEFT CR-ACME TECH PVT LTD-ANNUAL BONUS FY25", rupees(120000), "Bonus"))  # one-off
    ev.append((date(2026, 6, 14), "POS CROMA ELECTRONICS BLR", -rupees(82000), "Shopping"))                  # large purchase
    return ev


def bank_b_events(rng):
    """Spending + freelance account: subscriptions, food, travel, irregular income."""
    ev = []
    freelance_per_month = [1, 0, 2, 1, 0, 1, 2, 1]  # irregular on purpose; Mar and Jun have none
    for (y, m), n in zip(MONTHS, freelance_per_month):
        ev += [
            (date(y, m, 3), "NEFT CR-HDFC BANK 1234-SELF TRANSFER", rupees(20000), "Transfer"),  # other side of the transfer
            (date(y, m, 5), "SPOTIFY INDIA", -rupees(119), "Subscriptions"),
            (date(y, m, 12), "NETFLIX.COM", -rupees(649), "Subscriptions"),
            (date(y, m, 20), "APPLE ICLOUD", -rupees(75), "Subscriptions"),
        ]
        for _ in range(n):  # freelance credits: random day, random amount
            ev.append((date(y, m, rng.randint(2, 27)), f"IMPS CR-FREELANCE CLIENT {rng.randint(1, 4)}",
                       rupees(rng.randint(60, 550) * 100), "Freelance"))
        ev += spread(rng, y, m, 7, 250, 900, [("SWIGGY", "Food & Dining"), ("ZOMATO", "Food & Dining")])
        ev += spread(rng, y, m, 3, 120, 600, [("UBER INDIA", "Travel & Commute")])
        ev += spread(rng, y, m, 1, 1500, 2500, [("INDIAN OIL", "Fuel")])
    # Real duplicate charge: same order ref twice, same day, bank deducted both.
    ev += [(date(2026, 5, 18), "UPI/SWIGGY INSTAMART/ORD-SIM98231", -rupees(1499), "Groceries")] * 2
    # Genuine second payment: same amount, same day, but two different order refs.
    ev += [(date(2026, 7, 9), "UPI/AMAZON PAY/ORD-402-1111", -rupees(2499), "Shopping"),
           (date(2026, 7, 9), "UPI/AMAZON PAY/ORD-402-2222", -rupees(2499), "Shopping")]
    # New merchant: appears once, in the final month.
    ev.append((date(2026, 9, 14), "INTL POS STRIPE CURSOR AI", -rupees(1720), "Subscriptions"))
    return ev


# Merchants the keyword rules do not know, with their true category and the months (Feb=0 .. Sep=7)
# they appear in. Amounts stay small so they do not trigger the "large purchase" flag.
HARD_MERCHANTS = [
    ("BLINKIT", "Groceries", (500, 1500), (0, 2, 4, 6)),
    ("ZEPTO", "Groceries", (400, 1200), (1, 3, 5, 7)),
    ("MAKEMYTRIP", "Travel & Commute", (1800, 2400), (2, 6)),
    ("IRCTC", "Travel & Commute", (600, 1500), (1, 5, 7)),
    ("MYNTRA", "Shopping", (900, 1900), (3, 6)),
]


def hard_events(rng):
    """Spends the rules get wrong on purpose (they fall to 'Other'); a merchant correction fixes every row.
    Uses its own random stream so the rest of the data is unchanged."""
    ev = []
    for name, label, (lo, hi), month_idx in HARD_MERCHANTS:
        for i in month_idx:
            y, m = MONTHS[i]
            day = rng.randint(1, 28)
            ev.append((date(y, m, day), upi(rng, name), -rupees(rng.randint(lo, hi)), label))
    return ev


def short_events(rng):
    """The 2-month dataset: a plain salaried user."""
    ev = []
    for y, m in SHORT_MONTHS:
        ev += [
            (date(y, m, 1), "UPI/RENT/MS IYER LANDLORD", -rupees(18000), "Rent"),
            (date(y, m, 5), "NETFLIX.COM", -rupees(649), "Subscriptions"),
            (date(y, m, 28), "NEFT CR-BRIGHT LABS-SALARY", rupees(52000), "Salary"),
        ]
        ev += spread(rng, y, m, 4, 300, 1500, [("SWIGGY", "Food & Dining"), ("BIGBASKET", "Groceries")])
    return ev


def write_bank_a_style(path, acct, rows):
    """Format 1: DD/MM/YYYY, separate withdrawal and deposit columns, 1-line preamble."""
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Account No", acct])
        w.writerow(["Date", "Narration", "Withdrawal Amt", "Deposit Amt", "Closing Balance"])
        for day, text, amt, bal, _label in rows:
            w.writerow([day.strftime("%d/%m/%Y"), text,
                        money(-amt) if amt < 0 else "", money(amt) if amt > 0 else "", money(bal)])


def write_bank_b_style(path, acct, rows):
    """Format 2: ISO dates, one Amount column plus a Dr/Cr marker."""
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Account No", acct])
        w.writerow(["Transaction Date", "Description", "Amount", "Dr/Cr", "Balance"])
        for day, text, amt, bal, _label in rows:
            w.writerow([day.isoformat(), text, money(abs(amt)), "DR" if amt < 0 else "CR", money(bal)])


def write_labels(path, rows_by_account):
    """planted_labels.json: the TRUE category of every row, keyed the way the database stores it
    (account last 4, date, amount, description, balance). Used only to measure categorisation accuracy."""
    out = [{"last4": acct[-4:], "date": day.isoformat(), "amountPaise": amt, "description": text,
            "balancePaise": bal, "category": label}
           for acct, rows in rows_by_account for day, text, amt, bal, label in rows]
    path.write_text(json.dumps({"rows": out}, indent=1))


def generate(out_dir):
    """Write both datasets under out_dir and return the planted-case manifest."""
    out = Path(out_dir)
    (out / "eight_months").mkdir(parents=True, exist_ok=True)
    (out / "short_2mo").mkdir(parents=True, exist_ok=True)
    rng = random.Random(SEED)

    # Bank A: one ledger, exported as two overlapping files (Jul 10 - Jul 31 appears in both).
    rows_a = with_balances(rupees(150000), bank_a_events(rng))
    overlap_start, overlap_end = date(2026, 7, 10), date(2026, 7, 31)
    write_bank_a_style(out / "eight_months/bank_a_feb_jul.csv", ACCT_A, [r for r in rows_a if r[0] <= overlap_end])
    write_bank_a_style(out / "eight_months/bank_a_jul_sep.csv", ACCT_A, [r for r in rows_a if r[0] >= overlap_start])

    # Bank B: balances are computed on the full ledger, THEN the gap rows are dropped,
    # so the balance visibly jumps across the missing 10 days.
    rows_b_full = with_balances(rupees(40000), bank_b_events(rng) + hard_events(random.Random(SEED + 1)))
    rows_b = [r for r in rows_b_full if not GAP_START <= r[0] <= GAP_END]
    write_bank_b_style(out / "eight_months/bank_b_feb_sep.csv", ACCT_B, rows_b)

    # Same transactions with nothing removed: the forecast refuses data with a gap, so this
    # is the set to demo it on.
    (out / "eight_months_complete").mkdir(parents=True, exist_ok=True)
    write_bank_a_style(out / "eight_months_complete/bank_a_feb_jul.csv", ACCT_A, [r for r in rows_a if r[0] <= overlap_end])
    write_bank_a_style(out / "eight_months_complete/bank_a_jul_sep.csv", ACCT_A, [r for r in rows_a if r[0] >= overlap_start])
    write_bank_b_style(out / "eight_months_complete/bank_b_feb_sep.csv", ACCT_B, rows_b_full)

    rows_c = with_balances(rupees(60000), short_events(rng))
    write_bank_a_style(out / "short_2mo/bank_c_aug_sep.csv", ACCT_C, rows_c)

    write_labels(out / "eight_months/planted_labels.json", [(ACCT_A, rows_a), (ACCT_B, rows_b)])
    write_labels(out / "eight_months_complete/planted_labels.json", [(ACCT_A, rows_a), (ACCT_B, rows_b_full)])
    write_labels(out / "short_2mo/planted_labels.json", [(ACCT_C, rows_c)])

    manifest = {
        "overlapping_exports": {"files": ["bank_a_feb_jul.csv", "bank_a_jul_sep.csv"],
                                "overlap": [overlap_start.isoformat(), overlap_end.isoformat()]},
        "own_account_transfer": {"debit_in": "bank_a", "credit_in": "bank_b", "day_of_month": 3, "paise": rupees(20000)},
        "real_duplicate_charge": {"bank": "bank_b", "date": "2026-05-18", "ref": "ORD-SIM98231", "paise": rupees(1499)},
        "genuine_second_payment": {"bank": "bank_b", "date": "2026-07-09", "refs": ["ORD-402-1111", "ORD-402-2222"], "paise": rupees(2499)},
        "bonus_not_repeated": {"bank": "bank_a", "date": "2026-02-14", "paise": rupees(120000)},
        "large_purchase": {"bank": "bank_a", "date": "2026-06-14", "paise": rupees(82000)},
        "new_merchant": {"bank": "bank_b", "date": "2026-09-14", "paise": rupees(1720)},
        "date_gap": {"bank": "bank_b", "from": GAP_START.isoformat(), "to": GAP_END.isoformat()},
        "emi": {"bank": "bank_a", "day_of_month": 7, "paise": rupees(14500)},
        "rent": {"bank": "bank_a", "day_of_month": 1, "paise": rupees(28000)},
        "subscriptions": {"bank": "bank_b", "merchants": ["SPOTIFY INDIA", "NETFLIX.COM", "APPLE ICLOUD"]},
        "irregular_freelance_months_with_none": ["2026-03", "2026-06"],
        "hard_to_categorise": {"bank": "bank_b", "merchants": [m[0] for m in HARD_MERCHANTS]},
    }
    (out / "planted_cases.json").write_text(json.dumps(manifest, indent=2))
    return manifest


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent
    generate(target)
    print(f"Wrote demo data to {target}")
