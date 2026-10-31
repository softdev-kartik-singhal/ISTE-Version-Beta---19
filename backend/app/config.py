"""Every number that decides something lives here, so it can be defended in one place.

Money is always integer paise (1 rupee = 100 paise).
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "smartgullak.db"

# --- Duplicate / transfer detection ---------------------------------------
# Two rows with the same account, date, amount, balance and description are the
# same bank row exported twice (overlapping statements) -> dropped on import.
# Same merchant + amount + order reference within this many days, but DIFFERENT
# balances (so not a re-export) -> the bank charged twice -> flagged as a duplicate.
# 2 days = the 48 hours asked for; statements carry dates only, not times.
DUPLICATE_WINDOW_DAYS = 2

# A debit in one of the user's accounts and a credit of the same amount in
# another of their accounts within this many days is an own-account transfer.
TRANSFER_MATCH_DAYS = 2

# --- Flags -----------------------------------------------------------------
# A purchase is "large" if it is at least this multiple of the user's usual
# spend in that category (median of the previous months).
LARGE_PURCHASE_MULTIPLE = 3.0
# Need at least this many OTHER purchases in the category to know what "usual" is.
LARGE_MIN_HISTORY = 2
# ...and ignore small purchases however unusual (paise).
LARGE_MIN_PAISE = 200_000  # Rs 2,000

# A merchant never seen before is "new" if the charge is at least this big (paise).
NEW_MERCHANT_MIN_PAISE = 50_000  # Rs 500
# Every merchant is new on day 1, so only judge "new" this long after the user's first transaction.
NEW_MERCHANT_WARMUP_DAYS = 60

# --- Recurring detection -----------------------------------------------------
RECURRING_MIN_OCCURRENCES = 3
# Amounts count as "the same" if within +/-5% of each other (cluster width = 2 x this).
RECURRING_AMOUNT_TOLERANCE = 0.05
# Allowed gaps between payments: nominal days -> how many days either way we accept.
RECURRING_CADENCES = {7: 1, 30: 4, 365: 10}
# At least this share of the gaps must fit the cadence (one missed month should not break it).
RECURRING_MIN_GAP_SHARE = 0.6

# --- Categorisation ----------------------------------------------------------
# (whole word in the description, category, priority). Highest priority wins; ties go to the
# longer word. No match -> 'Other' for money out, 'Other Income' for money in.
CATEGORY_RULES = [
    ("SALARY", "Salary", 10), ("BONUS", "Bonus", 10), ("FREELANCE", "Freelance", 10),
    ("RENT", "Rent", 10), ("EMI", "EMI", 10),
    ("BESCOM", "Bills & Utilities", 10), ("ELECTRICITY", "Bills & Utilities", 5),
    ("NETFLIX", "Subscriptions", 10), ("SPOTIFY", "Subscriptions", 10),
    ("ICLOUD", "Subscriptions", 10), ("CURSOR", "Subscriptions", 10),
    ("INSTAMART", "Groceries", 10), ("BIGBASKET", "Groceries", 10), ("DMART", "Groceries", 10),
    ("SWIGGY", "Food & Dining", 5), ("ZOMATO", "Food & Dining", 5),
    ("UBER", "Travel & Commute", 10), ("INDIAN OIL", "Fuel", 10),
    ("CROMA", "Shopping", 10), ("AMAZON", "Shopping", 10),
]

# Coverage gap: the running balance fails to reconcile between two consecutive rows
# (previous balance + amount != balance) AND they are more than this many days apart.
# Short balance breaks are ignored; long ones mean rows are missing from the export.
GAP_DAYS_THRESHOLD = 7

# --- Forecast ---------------------------------------------------------------
# Refuse to forecast with fewer complete months of statements than this.
MIN_HISTORY_MONTHS = 3
# A month counts as complete only if the statements start within the first N days of
# its first month and end within the last N days of its last month.
MONTH_EDGE_SLACK_DAYS = 5

# Three cases. Each is (income percentile of past monthly income, which variable-spend
# figure to use). Worst = low income + high (P75) spending; best = the opposite.
CASES = {"worst": (10, "high"), "typical": (50, "median"), "best": (90, "low")}
# Variable spend per category = P25 / median / P75 of its monthly total over the last N months.
VARIABLE_MONTHS = 3
VARIABLE_LOW_PCT, VARIABLE_HIGH_PCT = 25, 75
# Cash we never treat as spendable, in months of committed costs (rent, EMI, subscriptions...).
BUFFER_MONTHS = 1.0

# One-off income = a source seen at most this many times that is not a recurring pattern,
# AND large: at least this share of regular monthly income and at least this many paise.
# One-offs are left out of the income forecast (last year's bonus will not repeat).
ONE_OFF_MAX_OCCURRENCES = 1
ONE_OFF_MIN_SHARE = 0.5
ONE_OFF_MIN_PAISE = 2_000_000  # Rs 20,000

# Confidence starts at High and loses a level for each of these that applies
# (0 -> High, 1 -> Medium, 2+ -> Low).
CONFIDENCE_MIN_MONTHS_HIGH = 6      # fewer months of history than this
CONFIDENCE_INCOME_SPREAD = 0.30     # (best - worst income) / typical income above this
CONFIDENCE_BORDERLINE_SHARE = 0.10  # typical-case money left is within this share of the price
CONFIDENCE_MAX_HORIZON = 1          # forecasting more months ahead than this

# --- Insights ----------------------------------------------------------------
TRENDS_MONTHS = 6            # months shown in trends
TREND_BASELINE_MONTHS = 3    # a category is compared with its median over this many earlier months
INSIGHT_MIN_MONTHS = 4       # this month + the baseline months; with fewer we say "insufficient history"
TREND_FLAT_PCT = 5           # within +/- this % of the median counts as "flat"
UPCOMING_DAYS = 7            # "upcoming payments" window after the latest statement date
SAFE_TO_SPEND_MARGIN = 0.10  # weekly safe-to-spend keeps this share of money-left unspent
CONCENTRATION_HIGH_PCT = 50  # one merchant above this share of a category is "concentrated"
MONEY_FLOW_TOP_N = 5         # merchants shown in the money-flow graph
# Fixed costs: not where a user would dig first, so never the default money-flow category.
FIXED_CATEGORIES = ["Rent", "EMI"]

# --- Surplus plan ---------------------------------------------------------------
# Spending categories that count as essentials for the emergency fund.
ESSENTIAL_CATEGORIES = ["Rent", "EMI", "Bills & Utilities", "Groceries", "Travel & Commute", "Fuel"]
EMERGENCY_FUND_MONTHS = 3    # emergency fund target = this many months of essentials
SURPLUS_DEFAULT_SPLIT = 60   # default % of monthly surplus sent to the emergency fund
SURPLUS_SPLIT_PRESETS = (100, 75, 60, 50, 25)

# --- Trust ---------------------------------------------------------------------
# The track record needs at least this many judged months before its hit rate means anything.
TRACK_RECORD_MIN_MONTHS = 3
# Categorisation check: at most this many simulated merchant corrections.
ACCURACY_MAX_STEPS = 20
DEMO_DIR = BASE_DIR / "demo_data"

# --- Upload ----------------------------------------------------------------
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # statements are small; refuse anything larger

# --- Demo account ----------------------------------------------------------------
# Signing in as this user loads the planted demo dataset for them if it is not loaded yet.
DEMO_EMAIL = "demo@smartgullak.app"
DEMO_PASSWORD = "demo-vault-2026"
DEMO_NAME = "Demo User"
DEMO_DATASET = "eight_months_complete"

# --- Auth, card, sensitive actions ------------------------------------------------
BCRYPT_ROUNDS = 12
PASSWORD_MIN_LENGTH = 8
SESSION_HOURS = 12
# After this many wrong passwords for one email, logins for it are refused for LOGIN_LOCK_SECONDS.
LOGIN_MAX_FAILURES = 5
LOGIN_LOCK_SECONDS = 300
# How long a "wait for a card tap" request stays open.
CARD_REQUEST_SECONDS = 60
# Export / delete / card replacement need a password check AND a card tap, each no older than this.
SENSITIVE_WINDOW_SECONDS = 60
# Shared secret the ESP32 sends in the X-Device-Secret header. Unset = card endpoints are switched off.
DEVICE_SECRET = os.environ.get("SMARTGULLAK_DEVICE_SECRET")
# Mixed into the card-UID hash. Card UIDs are short, so a plain hash could be guessed; the pepper is not in the database.
CARD_PEPPER = os.environ.get("SMARTGULLAK_CARD_PEPPER", "dev-only-change-me")
