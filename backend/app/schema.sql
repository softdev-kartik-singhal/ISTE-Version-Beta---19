-- SmartGullak schema. All money columns are INTEGER paise.

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,           -- bcrypt, never the password
    profile       TEXT,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tour_completed INTEGER NOT NULL DEFAULT 0,  -- 1 once the first-time tour is finished or skipped
    tour_step      INTEGER NOT NULL DEFAULT 0   -- the step to resume from if the user left midway
);

-- Only the last 4 digits of an account number are ever stored.
CREATE TABLE IF NOT EXISTS accounts (
    id       INTEGER PRIMARY KEY,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank     TEXT NOT NULL,
    last4    TEXT NOT NULL CHECK (length(last4) = 4),
    type     TEXT NOT NULL DEFAULT 'savings',
    UNIQUE (user_id, bank, last4)
);

-- One row per imported file. Only its hash is kept, never the file itself.
CREATE TABLE IF NOT EXISTS uploaded_files (
    id             INTEGER PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id     INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    file_hash      TEXT NOT NULL,          -- sha256: the same file twice by the SAME user is rejected
    file_name      TEXT,                   -- display name only, long digit runs masked
    file_type      TEXT,                   -- 'csv' or 'pdf'
    is_demo        INTEGER NOT NULL DEFAULT 0,  -- 1 = one of the bundled sample statements (never mixed with the user's own)
    duplicate_paise INTEGER NOT NULL DEFAULT 0,  -- total value of rows skipped as already imported
    row_count      INTEGER NOT NULL,
    new_rows       INTEGER NOT NULL,
    duplicate_rows INTEGER NOT NULL,
    first_date     TEXT,
    last_date      TEXT,
    uploaded_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, file_hash)
);

CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE,
    kind  TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'transfer'))
);

-- Keyword rule: description containing `pattern` gets `category_id`. Higher priority wins.
CREATE TABLE IF NOT EXISTS category_rules (
    id          INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    pattern     TEXT NOT NULL UNIQUE,
    priority    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
    id            INTEGER PRIMARY KEY,
    account_id    INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    file_id       INTEGER REFERENCES uploaded_files(id) ON DELETE SET NULL,
    txn_date      TEXT NOT NULL,           -- ISO yyyy-mm-dd
    amount_paise  INTEGER NOT NULL,        -- negative = money out
    balance_paise INTEGER,                 -- running balance after this row
    description   TEXT NOT NULL,
    merchant      TEXT,
    category_id   INTEGER REFERENCES categories(id),
    kind          TEXT NOT NULL DEFAULT 'normal' CHECK (kind IN ('normal', 'transfer', 'duplicate')),
    -- hash(account, date, amount, balance, description): identical = same bank row
    fingerprint   TEXT NOT NULL UNIQUE,
    source        TEXT NOT NULL DEFAULT 'statement',  -- 'manual' = typed in by the user (cash wallet)
    note          TEXT                                -- the user's own note on a manual row; never sent to the AI
);
CREATE INDEX IF NOT EXISTS idx_txn_account_date ON transactions(account_id, txn_date);

-- A user's manual category change; always beats the rules. One row per changed transaction.
-- batch_id groups the rows changed by one click (so one click can be undone);
-- applies_to_merchant=1 means "remember this merchant" for future uploads too.
CREATE TABLE IF NOT EXISTS corrections (
    id                   INTEGER PRIMARY KEY,
    transaction_id       INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    category_id          INTEGER NOT NULL REFERENCES categories(id),
    previous_category_id INTEGER REFERENCES categories(id),
    batch_id             TEXT NOT NULL,
    applies_to_merchant  INTEGER NOT NULL DEFAULT 1,
    created_at           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_corrections_batch ON corrections(batch_id);

CREATE TABLE IF NOT EXISTS flag_decisions (
    id             INTEGER PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    flag_type      TEXT NOT NULL CHECK (flag_type IN ('duplicate', 'large', 'new-merchant')),
    decision       TEXT NOT NULL,          -- e.g. 'confirmed', 'dismissed'
    decided_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (transaction_id, flag_type)
);

CREATE TABLE IF NOT EXISTS recurring (
    id             INTEGER PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant       TEXT NOT NULL,
    label          TEXT NOT NULL CHECK (label IN ('subscription', 'emi', 'rent', 'salary', 'bill', 'income', 'other')),
    typical_paise  INTEGER NOT NULL,       -- signed: negative = money out
    cadence_days   INTEGER NOT NULL,       -- 7, 30 or 365
    occurrences    INTEGER NOT NULL,
    last_seen      TEXT NOT NULL,
    next_expected  TEXT NOT NULL
);

-- Append-only, hash-chained log of monthly-surplus forecasts and what actually happened.
-- entry_hash = SHA-256(prev_hash + the entry's own fields); prev_hash is the user's previous entry
-- (64 zeros for the first). Changing or removing an old row breaks every later link.
CREATE TABLE IF NOT EXISTS forecast_log (
    id            INTEGER PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind          TEXT NOT NULL CHECK (kind IN ('forecast', 'actual')),
    source        TEXT NOT NULL CHECK (source IN ('live', 'backtest')),
    made_on       TEXT NOT NULL,
    target_month  TEXT NOT NULL,           -- yyyy-mm the entry is about
    worst_paise   INTEGER,                 -- forecast entries: the band and the middle
    typical_paise INTEGER,
    best_paise    INTEGER,
    actual_paise  INTEGER,                 -- actual entries: what really happened
    prev_hash     TEXT NOT NULL,
    entry_hash    TEXT NOT NULL,
    UNIQUE (user_id, prev_hash),           -- the chain cannot fork
    UNIQUE (user_id, kind, target_month)   -- one forecast and one actual per month
);

CREATE TABLE IF NOT EXISTS goals (
    id           INTEGER PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    target_paise INTEGER NOT NULL,
    saved_paise  INTEGER NOT NULL DEFAULT 0,
    target_date  TEXT,
    category     TEXT,
    priority     TEXT
);

-- Login sessions. Only the SHA-256 of the token is stored, never the token itself.
-- password_verified_at: set by "verify password" and used up by a sensitive action (60 s window).
CREATE TABLE IF NOT EXISTS sessions (
    token_hash           TEXT PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at           INTEGER NOT NULL,   -- unix seconds
    expires_at           INTEGER NOT NULL,
    password_verified_at INTEGER
);

-- A browser asking "wait for a card tap". The ESP32 then posts the UID and the server resolves
-- the one pending request. 'used' = a finished verification that a sensitive action has consumed.
CREATE TABLE IF NOT EXISTS card_requests (
    id           INTEGER PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind         TEXT NOT NULL CHECK (kind IN ('register', 'verify')),
    replace_card INTEGER NOT NULL DEFAULT 0,  -- register request that may replace the existing card
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'failed', 'used')),
    error_code   TEXT,
    last4        TEXT,
    created_at   INTEGER NOT NULL,
    completed_at INTEGER
);

-- NFC card. Only a hash of the UID is stored; UNIQUE stops one card linking to two users.
CREATE TABLE IF NOT EXISTS cards (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    uid_hash   TEXT NOT NULL UNIQUE,
    last4      TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO categories (name, kind) VALUES
    ('Salary', 'income'), ('Freelance', 'income'), ('Bonus', 'income'), ('Other Income', 'income'),
    ('Rent', 'expense'), ('EMI', 'expense'), ('Bills & Utilities', 'expense'),
    ('Subscriptions', 'expense'), ('Food & Dining', 'expense'), ('Groceries', 'expense'),
    ('Travel & Commute', 'expense'), ('Fuel', 'expense'), ('Shopping', 'expense'), ('Other', 'expense'),
    ('Transfer', 'transfer');

-- Optional "About you" answers for the suggestions feature. Bands and labels only; stored for this user alone.
CREATE TABLE IF NOT EXISTS suggestion_about (
    user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age_band      TEXT,
    dependents    TEXT,
    risk_comfort  TEXT,
    employer_health_cover INTEGER,   -- 1 / 0, NULL = not answered
    has_daughter  INTEGER            -- 1 / 0, NULL = not answered
);

-- AI answers cached by the hash of the anonymised profile. The profile holds no personal data, so it is safe to share.
CREATE TABLE IF NOT EXISTS suggestion_cache (
    profile_hash TEXT PRIMARY KEY,
    result_json  TEXT NOT NULL,
    created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
