# SmartGullak backend

FastAPI + SQLite. All money is integer paise. No LLM is used for any calculation.

## Run

```
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python demo_data/generate.py          # (re)creates the demo CSVs
export SMARTGULLAK_DEVICE_SECRET='pick-a-long-random-string'   # shared with the ESP32
.venv/bin/python -m app.seed                    # demo login: demo@smartgullak.app / demo-vault-2026 (or the 'Try the demo account' button)
.venv/bin/uvicorn app.main:app --reload         # API on :8000, docs at /docs
.venv/bin/python -m pytest -q
```

Delete `smartgullak.db` after pulling schema changes (there is no migration tool).

## Environment

| Variable | Meaning |
|---|---|
| `SMARTGULLAK_DEVICE_SECRET` | Shared secret the ESP32 sends. **Unset = the card endpoints are off (503).** |
| `SMARTGULLAK_CARD_PEPPER` | Mixed into the card-UID hash. Set a long random value in production; changing it unlinks every card. |

Every decision threshold (duplicate window, forecast percentiles, buffer, session length, the 60-second sensitive window...) is in `app/config.py`.

## Sign-in

`POST /api/auth/signup` and `/api/auth/login` return `{token}`. Send `Authorization: Bearer <token>` on every other call. Passwords are bcrypt-hashed; only the SHA-256 of a session token is stored; tokens last 12 hours; 5 wrong passwords lock an email for 5 minutes.

## The card (ESP32) protocol

The ESP32 never knows who the user is. The signed-in browser opens a request and the server matches the tap to it.

1. Browser: `POST /api/card/register/start` (or `/api/card/verify/start`) -> `{requestId}`
2. ESP32, within 60 s: `POST /api/card/register` (or `/api/card/verify`)
   ```
   X-Device-Secret: <shared secret>
   Content-Type: application/json
   {"uid": "04:A2:19:4F:2A"}
   ```
   Replies: `200` ok; `404 NO_PENDING_REQUEST` (nobody is waiting); `409 ALREADY_LINKED` / `AMBIGUOUS_REQUEST`; `403 MISMATCH` (wrong card); `401` bad secret; `503` secret not configured; `422` malformed UID.
3. Browser polls `GET /api/card/requests/{requestId}` -> `pending` / `done` / `failed` (+ `errorCode`).

Only a peppered SHA-256 of the UID is stored (plus its last 4 characters for display). One card per account; a card can belong to one account only. Limit: the server serves one waiting person per kind at a time (two people waiting at once get `AMBIGUOUS_REQUEST`).

## Export, delete, replace card

`POST /api/data/export`, `DELETE /api/data` and `POST /api/card/register/start {"replace": true}` need **both**:
`POST /api/auth/verify-password` and a card tap on `/api/card/verify/start`, each no older than 60 seconds. A verification pays for one action. Delete removes the user and everything attached to it; the shared categories and keyword rules stay.

## Tests

`tests/test_planted_cases.py` has one test per planted demo case (see `demo_data/README.md`). The other `test_phase*.py` files cover each phase.
