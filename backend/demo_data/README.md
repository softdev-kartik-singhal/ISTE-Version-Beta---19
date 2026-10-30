# Demo data

Regenerate (seeded, identical every run): `python demo_data/generate.py`
Machine-readable list of the cases below: `planted_cases.json`.

All amounts in the CSVs are rupees with 2 decimals, as banks print them. The importer converts to integer paise.

## Files

| File | Bank / format | Account no. (fake) | Covers |
|---|---|---|---|
| `eight_months/bank_a_feb_jul.csv` | A: `DD/MM/YYYY`, Withdrawal / Deposit columns | 50100123451234 | Feb 2026 – 31 Jul 2026 |
| `eight_months/bank_a_jul_sep.csv` | A, same format | 50100123451234 | 10 Jul 2026 – Sep 2026 |
| `eight_months/bank_b_feb_sep.csv` | B: ISO dates, Amount + Dr/Cr columns | 7312345678905678 | Feb – Sep 2026 |
| `short_2mo/bank_c_aug_sep.csv` | A format, a separate user | 90210055559999 | Aug – Sep 2026 |

Each file starts with an `Account No` line carrying the **full** number, so the parser's masking (last 4 digits only) can be tested.

## Planted cases (eight-month set)

| # | Case | Where | What the system must do |
|---|---|---|---|
| 1 | **Overlapping exports** | A: `feb_jul` and `jul_sep` both contain 10–31 Jul rows with identical balances | Import both; identical rows are dropped by fingerprint, none counted twice |
| 2 | **Own-account transfer** | A debit `SELF TRANSFER TO KOTAK 5678` and B credit `HDFC BANK 1234-SELF TRANSFER`, Rs 20,000 on the 3rd of every month | Pair them, mark `kind = transfer`, exclude from spending and income |
| 3 | **Real duplicate charge** | B, 18 May 2026: Swiggy Instamart `ORD-SIM98231` Rs 1,499 twice. Same order ref; the balance drops twice | Keep both rows, flag as a duplicate charge |
| 4 | **Genuine second payment** | B, 9 Jul 2026: Amazon Pay Rs 2,499 twice, order refs `ORD-402-1111` and `ORD-402-2222`, different balances | Not a duplicate, no flag |
| 5 | **Irregular freelance income** | B: `IMPS CR-FREELANCE CLIENT n`, 0–2 credits a month, Rs 6,000–55,000. No credits in Mar and Jun | Income forecast must stay conservative (low percentile) |
| 6 | **Last year's bonus, not repeated** | A, 14 Feb 2026: `ANNUAL BONUS FY25`, Rs 1,20,000, once | Excluded from the forecast as one-off income |
| 7 | **Subscriptions** | B: Spotify Rs 119 (5th), Netflix Rs 649 (12th), iCloud Rs 75 (20th) | Detected as recurring subscriptions |
| 8 | **EMI** | A, 7th monthly: `ACH D-HDFC LTD-EMI-LN00482`, Rs 14,500 | Detected as recurring EMI; counts as a fixed cost |
| 9 | **Rent** | A, 1st monthly: Rs 28,000 to the landlord | Detected as recurring rent; counts as a fixed cost |
| 10 | **One large purchase** | A, 14 Jun 2026: Croma Electronics, Rs 82,000 | "Large purchase" flag; kept out of normal-month spending |
| 11 | **New merchant** | B, 14 Sep 2026: `INTL POS STRIPE CURSOR AI`, Rs 1,720, first and only appearance | "New merchant" flag |
| 12 | **10-day date gap** | B: no rows 11–20 Aug 2026, and the balance jumps across the hole | Coverage report shows a 10-day gap |

Also present: salary (28th, Rs 95,000), electricity bill, groceries, Swiggy / Zomato, Uber, fuel.

## Eight months without the gap

`eight_months_complete/` holds the same transactions with nothing removed from bank B. The forecast refuses data with a gap over 7 days (case 12), so use this set to see an actual forecast.

## Two-month set

`short_2mo/bank_c_aug_sep.csv`: salary, rent, Netflix, a few food and grocery spends. It has too little history for percentile forecasts, so it tests the "not enough data" path.
