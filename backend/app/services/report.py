"""The export: one self-contained HTML report of everything SmartGullak worked out from the user's statements.

No new maths here. Every number comes from the same functions the app's pages use (dashboard, trends, surplus
plan, goals, flags, cash, track record), so the report always matches what the user saw on screen. This file only
collects those results and lays them out. The raw transactions go in an appendix at the end.

The file opens in any browser with no internet connection (no scripts, no external CSS or fonts), and the
browser's Print -> Save as PDF turns it into a PDF. Every piece of text that came from a statement is escaped.
"""
from datetime import date, datetime
from html import escape

from app.config import SURPLUS_DEFAULT_SPLIT
from app.routers.goals import goal_rows
from app.services.account import export_data
from app.services.cash import cash_payload
from app.services.flags import flags_payload
from app.services.forecast import build_inputs
from app.services.goals import assess, portfolio
from app.services.insights import dashboard, load_ledger, trends
from app.services.money import inr
from app.services.summary import statements_payload
from app.services.surplus_plan import surplus_plan
from app.services.track_record import track_record

RECURRING_TYPES = {"salary": "Salary", "rent": "Rent", "emi": "EMI", "subscription": "Subscription", "bill": "Bill",
                   "income": "Income", "other": "Other"}
FLAG_TYPES = {"large": "Unusually large", "duplicate": "Possible duplicate", "new-merchant": "New payee"}


# ---------------------------------------------------------------- collecting

def recurring_items(conn, user_id):
    return [dict(r) for r in conn.execute("SELECT merchant, label, typical_paise, cadence_days, occurrences, next_expected"
                                          " FROM recurring WHERE user_id = ? ORDER BY next_expected", (user_id,))]


def report_data(conn, user_id):
    """Every section's numbers, straight from the services behind each page."""
    ledger, inp = load_ledger(conn, user_id), build_inputs(conn, user_id)
    goals = assess(inp, ledger, goal_rows(conn, user_id))
    name = conn.execute("SELECT name FROM users WHERE id = ?", (user_id,)).fetchone()["name"]
    return {
        "name": name,
        "generated": datetime.now().strftime("%d %b %Y, %H:%M"),
        "dashboard": dashboard(ledger, inp),
        "trends": trends(ledger, inp),
        "plan": surplus_plan(ledger, inp, SURPLUS_DEFAULT_SPLIT),
        "goals": {"goals": goals, "summary": portfolio(goals, inp, ledger)},
        "recurring": recurring_items(conn, user_id),
        "flags": flags_payload(conn, user_id),
        "cash": cash_payload(conn, user_id),
        "statements": statements_payload(conn, user_id),
        "trackRecord": track_record(conn, user_id),
        "transactions": export_data(conn, user_id)["transactions"],
    }


# ---------------------------------------------------------------- small HTML helpers

def e(value):
    """Escape anything that came from a statement or the user before it goes into the page."""
    return escape(str(value if value is not None else "—"))


def money(paise, sign=False):
    if paise is None:
        return "—"
    return f"+{inr(paise)}" if sign and paise > 0 else inr(paise)


def month_name(month):
    """'2026-09' -> 'Sep 2026'."""
    return datetime.strptime(month, "%Y-%m").strftime("%b %Y")


def day(iso):
    """'2026-09-28' -> '28 Sep 2026'."""
    return date.fromisoformat(iso[:10]).strftime("%d %b %Y") if iso else "—"


def table(headers, rows, numeric=()):
    """headers: column titles; rows: lists of already-escaped cells; numeric: column indexes to right-align."""
    if not rows:
        return '<p class="muted">Nothing to show yet.</p>'
    cls = lambda i: ' class="num"' if i in numeric else ""
    head = "".join(f"<th{cls(i)}>{h}</th>" for i, h in enumerate(headers))
    body = "".join("<tr>" + "".join(f"<td{cls(i)}>{c}</td>" for i, c in enumerate(r)) + "</tr>" for r in rows)
    return f"<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"


def tiles(items):
    """Headline numbers: [(label, value, note)]."""
    cells = "".join(f'<div class="tile"><div class="label">{label}</div><div class="value">{value}</div>'
                    f'<div class="muted">{note}</div></div>' for label, value, note in items)
    return f'<div class="tiles">{cells}</div>'


def section(number, title, intro, body):
    return f'<section><h2><span class="n">{number}</span>{title}</h2><p class="intro">{intro}</p>{body}</section>'


def tone(paise):
    return "pos" if paise >= 0 else "neg"


# ---------------------------------------------------------------- sections

def overview_section(d):
    dash, summary = d["dashboard"], d["trends"]["summary"]
    latest, now = dash["latestMonth"], dash["thisMonth"]
    body = tiles([
        ("Money in, " + month_name(latest["month"]), money(latest["inflowPaise"]), "Salary, refunds and other credits"),
        ("Money out, " + month_name(latest["month"]), money(latest["outflowPaise"]), "Spending, bills and EMIs"),
        ("Left over, " + month_name(latest["month"]), f'<span class="{tone(latest["surplusPaise"])}">{money(latest["surplusPaise"], True)}</span>',
         "Money in minus money out"),
        ("Typical monthly surplus", money(summary["averageSurplusPaise"]), f'Average of {dash["monthsAvailable"]} months'),
        ("Cash in your accounts", money(dash["cashPaise"]), f'Closing balances on {day(dash["asOf"])}'),
        ("Safe to spend each week", money(now["weeklySafeToSpendPaise"]), f'Until your next salary ({day(now["nextSalary"])})'),
    ])
    return section(1, "At a glance", f'Based on {dash["monthsAvailable"]} months of statements up to {day(dash["asOf"])}.', body)


def history_section(d):
    months = d["trends"]["months"]
    widest = max((abs(m["surplusPaise"]) for m in months), default=1) or 1
    rows = [[month_name(m["month"]), money(m["inflowPaise"]), money(m["outflowPaise"]),
             f'<span class="{tone(m["surplusPaise"])}">{money(m["surplusPaise"], True)}</span>',
             f'<div class="bar {tone(m["surplusPaise"])}" style="width:{abs(m["surplusPaise"]) / widest * 100:.0f}%"></div>']
            for m in months]
    s = d["trends"]["summary"]
    notes = "".join(f"<li>{e(f)}</li>" for f in d["trends"]["findings"])
    notes += f'<li>Best month: {month_name(s["best"]["month"])} ({money(s["best"]["surplusPaise"], True)}). {e(s["best"]["reason"])}.</li>'
    notes += f'<li>Toughest month: {month_name(s["toughest"]["month"])} ({money(s["toughest"]["surplusPaise"], True)}). {e(s["toughest"]["reason"])}.</li>'
    body = table(["Month", "Money in", "Money out", "Surplus", ""], rows, numeric=(1, 2, 3)) + f'<ul class="notes">{notes}</ul>'
    return section(2, "Month by month", "Money in, money out and what was left, for every full month in your statements.", body)


def spending_section(d):
    t = d["trends"]
    rows = [[e(c["name"]), money(c["thisMonthPaise"]), money(c["medianPaise"]),
             f'{c["changePct"]:+.0f}%' if c["changePct"] is not None else "—", e(c["insight"])] for c in t["categories"]]
    body = table(["Category", month_name(t["categoryMonth"]), "Usual month", "Change", "What we noticed"], rows, numeric=(1, 2, 3))
    return section(3, "Where the money goes", f'Spending by category in {month_name(t["categoryMonth"])}, against your usual month (the median).', body)


def recurring_section(d):
    rows = [[e(r["merchant"]), RECURRING_TYPES.get(r["label"], e(r["label"])), money(abs(r["typical_paise"])),
             f'Every {r["cadence_days"]} days', str(r["occurrences"]), day(r["next_expected"])] for r in d["recurring"]]
    body = table(["Payee", "Type", "Usual amount", "How often", "Times seen", "Next expected"], rows, numeric=(2, 4))
    return section(4, "Regular payments", "Same payee, similar amount, at regular gaps, seen at least 3 times.", body)


def flags_section(d):
    f = d["flags"]
    rows = [[day(x["date"]), e(x["merchant"]), money(x["amountPaise"]), FLAG_TYPES.get(x["type"], e(x["type"])), e(x["reason"])] for x in f["flags"]]
    rows += [[day(x["date"]), e(x["merchant"]), money(x["amountPaise"]), FLAG_TYPES.get(x["type"], e(x["type"])), f'You marked it: {e(x.get("decision"))}']
             for x in f["resolved"]]
    body = table(["Date", "Payee", "Amount", "Flag", "Why"], rows, numeric=(2,))
    return section(5, "Things worth a second look", f'{f["openCount"]} open and {len(f["resolved"])} reviewed: unusually large payments, '
                   "new payees and possible duplicates.", body)


def plan_section(d):
    p = d["plan"]
    if p.get("insufficientHistory"):
        return section(6, "Surplus plan", "Not enough history yet for a plan.", "")
    fund, s, chosen = p["emergencyFund"], p["surplus"], p["allocation"]["chosen"]
    body = tiles([
        ("Emergency fund target", money(fund["targetPaise"]), f'{fund["bufferMonths"]} months of essentials ({money(fund["monthlyEssentialsPaise"])}/month)'),
        ("Saved so far", money(fund["savedPaise"]), f'Covers {fund["monthsCovered"]:.1f} months of essentials'),
        ("Still to save", money(fund["shortfallPaise"]), "Fully funded" if fund["funded"] else f'About {chosen["monthsToFund"]} months at the split below'),
        ("Monthly surplus range", f'{money(s["lowPaise"])} – {money(s["highPaise"])}', f'Typical {money(s["typicalPaise"])}'),
    ])
    essentials = [[e(x["name"]), money(x["monthlyPaise"])] for x in fund["essentials"]]
    body += "<h3>Essentials counted</h3>" + table(["Category", "Per month"], essentials, numeric=(1,))
    body += (f'<p>With a {chosen["splitPct"]}/{100 - chosen["splitPct"]} split of the typical surplus: '
             f'{money(chosen["monthlyToEmergencyPaise"])} a month to the emergency fund and {money(chosen["monthlyToOtherGoalsPaise"])} to other goals.</p>')
    return section(6, "Surplus plan", f'{e(p["framework"])}. {e(p["disclaimer"])}', body)


def goals_section(d):
    g, s = d["goals"]["goals"], d["goals"]["summary"]
    rows = [[e(x["name"]), money(x["targetPaise"]), money(x["savedPaise"]), f'{x["percentFunded"]:.0f}%', day(x["targetDate"]),
             money(x["monthlyNeededPaise"]), e(x["statusText"])] for x in g]
    intro = (f'{s["onTrack"]} of {s["count"]} goals on track. They need {money(s["monthlyRequiredPaise"])} a month '
             f'against a typical surplus of {money(s["typicalSurplusPaise"])}.') if g else "No goals added yet."
    body = table(["Goal", "Target", "Saved", "Funded", "By", "Needed / month", "Status"], rows, numeric=(1, 2, 3, 5)) if g else ""
    return section(7, "Goals", intro, body)


def cash_section(d):
    w = d["cash"]["wallet"]
    if not (w["withdrawnPaise"] or w["receivedPaise"] or d["cash"]["entries"]):
        return section(8, "Cash", "No cash withdrawals or cash entries yet.", "")
    body = tiles([
        ("Cash in hand (estimated)", money(w["balancePaise"]), "Withdrawn + received − spent − deposited"),
        ("Withdrawn from ATMs", money(w["withdrawnPaise"]), "Moved from bank to wallet, not spending"),
        ("Spent in cash (recorded)", money(w["spentPaise"]), "Entries you added"),
        ("Not recorded, counted as spent", money(w["countedAsSpendingPaise"]), f'Cash unaccounted for after {w["unrecordedDays"]} days'),
    ])
    return section(8, "Cash", "Cash is tracked as a wallet so ATM withdrawals are not counted as spending twice.", body)


def track_record_section(d):
    t = d["trackRecord"]
    if not t["enoughToJudge"]:
        intro = f'{t["judgedMonths"]} forecast months have been checked against reality so far; more are needed to judge accuracy.'
        body = ""
    else:
        s = t["summary"]
        intro = "Each month's forecast is logged before the month ends, then compared with what actually happened."
        body = tiles([("Months in range", f'{s["hitRate"] * 100:.0f}%', t["meaning"]["hitRate"]),
                      ("Average miss", money(s["averageMissPaise"]), t["meaning"]["averageMissPaise"]),
                      ("Bias", money(s["biasPaise"], True), t["meaning"]["biasPaise"])])
    chain = t["chain"]
    body += (f'<p class="muted">Forecast log: {chain["entries"]} entries, tamper check '
             f'{"passed" if chain["valid"] else "FAILED"}.</p>')
    return section(9, "How good our forecasts have been", intro, body)


def sources_section(d):
    s = d["statements"]
    rows = [[e(f["name"]), f'{e(f["bank"])} ••{e(f["last4"])}', f'{day(f["firstDate"])} – {day(f["lastDate"])}', str(f["rows"]),
             str(f["duplicateRows"])] for f in s["files"]]
    m, gaps = s["merge"], s["coverage"]["gapCount"]
    body = table(["File", "Account", "Covers", "Rows", "Duplicates skipped"], rows, numeric=(3, 4))
    body += (f'<p>{m["records"]} transactions across {m["accounts"]} accounts after merging. {m["duplicatesSkipped"]} duplicate rows skipped; '
             f'{m["transferPairs"]} transfers between your own accounts ({money(m["transferPaise"])}) left out of income and spending. '
             f'{"No gaps in coverage." if not gaps else f"{gaps} gap(s) in coverage: some days are missing from the statements."}</p>')
    return section(10, "What this report is based on", "Your uploaded statements. The original files were never stored; "
                   "only the transactions read from them, with account numbers cut to the last 4 digits.", body)


def transactions_appendix(d):
    rows = [[day(t["date"]), e(t["description"]), e(t["category"]), f'{e(t["bank"])} ••{e(t["last4"])}',
             f'<span class="{tone(t["amountPaise"])}">{money(t["amountPaise"], True)}</span>'
             + (' <span class="muted">(transfer)</span>' if t["kind"] == "transfer" else "")] for t in d["transactions"]]
    return section("A", "All transactions", f'Every transaction SmartGullak read, with the category it was given ({len(rows)} rows).',
                   table(["Date", "Description", "Category", "Account", "Amount"], rows, numeric=(4,)))


# ---------------------------------------------------------------- page

STYLE = """
:root{--ink:#0f1b2d;--muted:#5b6b80;--line:#e3e8ef;--soft:#f4f6fa;--brand:#1b3a8a;--pos:#147a4a;--neg:#b3261e}
*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font:14px/1.5 -apple-system,"Segoe UI",Roboto,Arial,sans-serif}
main{max-width:980px;margin:0 auto;padding:40px 24px}
header{border-bottom:3px solid var(--brand);padding-bottom:16px;margin-bottom:24px}
header h1{margin:0;font-size:28px;color:var(--brand)}header p{margin:4px 0 0;color:var(--muted)}
section{margin:0 0 32px;page-break-inside:avoid}section:last-of-type{page-break-inside:auto}
h2{font-size:19px;margin:0 0 4px;display:flex;align-items:center;gap:10px}
h2 .n{background:var(--brand);color:#fff;border-radius:6px;font-size:13px;min-width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
h3{font-size:15px;margin:16px 0 6px}.intro{color:var(--muted);margin:0 0 12px}.muted{color:var(--muted);font-size:12px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.tile{background:var(--soft);border-radius:10px;padding:12px 14px}.tile .label{font-size:12px;color:var(--muted)}.tile .value{font-size:20px;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:var(--muted);font-weight:600;border-bottom:2px solid var(--line);padding:6px 8px}
td{border-bottom:1px solid var(--line);padding:6px 8px;vertical-align:top}.num{text-align:right;white-space:nowrap}
.pos{color:var(--pos)}.neg{color:var(--neg)}.bar{height:8px;border-radius:4px;min-width:2px}.bar.pos{background:var(--pos)}.bar.neg{background:var(--neg)}
.notes{margin:12px 0 0;padding-left:18px}.notes li{margin:2px 0}
footer{border-top:1px solid var(--line);padding-top:12px;color:var(--muted);font-size:12px}
@media print{main{padding:0}a{color:inherit}}
"""


def render(d):
    """The whole report as one HTML string."""
    if d["dashboard"].get("insufficientHistory"):
        sections = section(1, "Not enough data yet", "Upload at least 3 full months of statements to get the analysis. "
                           "The transactions read so far are listed below.", "") + transactions_appendix(d)
    else:
        sections = "".join(build(d) for build in (overview_section, history_section, spending_section, recurring_section,
                                                 flags_section, plan_section, goals_section, cash_section,
                                                 track_record_section, sources_section, transactions_appendix))
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>SmartGullak report – {e(d["name"])}</title><style>{STYLE}</style></head><body><main>'
            f'<header><h1>SmartGullak financial report</h1><p>Prepared for {e(d["name"])} · Generated {d["generated"]}</p></header>'
            f'{sections}'
            f'<footer>Every figure is calculated from your own bank statements by fixed rules; no AI was used for any number. '
            f'For learning only, not financial advice. To save as PDF, use your browser\'s Print → Save as PDF.</footer>'
            f'</main></body></html>')


def build_report(conn, user_id):
    """POST /api/data/export: the file name and the report HTML."""
    return {"fileName": f"SmartGullak_Report_{date.today().isoformat()}.html", "html": render(report_data(conn, user_id))}
