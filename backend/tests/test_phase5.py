"""Phase 5 tests: dashboard, trends, money flow, surplus plan, goals."""
import json
from dataclasses import replace
from datetime import date
from math import ceil
from statistics import median

import pytest

from app.db import connect
from app.services.forecast import build_inputs
from app.services.goals import months_left
from app.services.insights import due_dates, this_month, upcoming
from app.services.surplus_plan import months_to_fund, surplus_plan


def get(client, url, **params):
    return client.get(url, params=params)


def ask_headroom(client, month, case):
    return client.post("/api/ask", json={"amountPaise": 1, "targetMonth": month}).json()["cases"][case]["headroomPaise"]


# ---------- dashboard ----------

def test_monthly_surplus_matches_transactions(complete):
    d = get(complete, "/api/dashboard").json()
    sep = get(complete, "/api/transactions", date_from="2026-09-01", date_to="2026-09-30").json()["summary"]
    assert d["latestMonth"]["month"] == "2026-09"
    assert d["latestMonth"]["inflowPaise"] == sep["inflowPaise"] and d["latestMonth"]["outflowPaise"] == sep["outflowPaise"]
    assert d["monthlySurplus"] == sep["inflowPaise"] - sep["outflowPaise"]


def test_planning_surplus_leaves_out_the_bonus(complete, db_path):
    from app.services.insights import load_ledger, monthly_series, planning_surplus
    conn = connect(db_path)
    inp, ledger = build_inputs(conn, 1), load_ledger(conn, 1)
    actual, planning = monthly_series(ledger, inp), planning_surplus(ledger, inp)
    feb = inp.history_months.index("2026-02")
    assert actual[feb]["oneOffPaise"] == 12_000_000
    assert planning[feb] == actual[feb]["surplusPaise"] - 12_000_000          # bonus removed from Feb only
    assert [p for p, a in zip(planning, actual) if p != a["surplusPaise"]] == [planning[feb]]
    assert get(complete, "/api/dashboard").json()["planningSurplusPaise"] == int(median(planning))


def test_dashboard_without_data_or_with_two_months(client):
    assert get(client, "/api/dashboard").json()["insufficientHistory"] is True
    client.post("/api/demo-data?set=short_2mo")
    d = get(client, "/api/dashboard").json()
    assert d["insufficientHistory"] is False and d["monthsAvailable"] == 2


# ---------- this month / safe to spend / upcoming ----------

def synthetic(complete_inp, rows, **changes):
    ledger = [{"month": r[0][:7], "txn_date": r[0], "amount_paise": r[1], "merchant": r[2], "category": "X"} for r in rows]
    return ledger, replace(complete_inp, **changes)


@pytest.fixture
def inp(complete, db_path):
    return build_inputs(connect(db_path), 1)


def test_money_left_and_weekly_safe_to_spend(inp):
    ledger, i = synthetic(inp, [("2026-09-01", 10_000_000, "S"), ("2026-09-05", -2_000_000, "SHOP")],
                          as_of=date(2026, 9, 10), monthly_income=(9_000_000,),
                          recurring=({"merchant": "GYM", "label": "other", "typical_paise": -500_000, "cadence_days": 30,
                                      "last_seen": "2026-08-20"},), one_offs=())
    t = this_month(ledger, i)
    assert (t["incomeReceivedPaise"], t["spentSoFarPaise"], t["committedStillDuePaise"]) == (10_000_000, 2_000_000, 500_000)
    assert t["moneyLeftPaise"] == 7_500_000 and t["daysLeft"] == 20
    assert t["nextSalary"] is None and t["safeUntil"] == "2026-09-30"           # no salary: until month end
    assert t["weeklySafeToSpendPaise"] == round(7_500_000 / (20 / 7))


def test_salary_not_yet_received_uses_typical_income(inp):
    ledger, i = synthetic(inp, [("2026-09-02", -1_000_000, "SHOP")], as_of=date(2026, 9, 3), monthly_income=(9_500_000,),
                          recurring=(), one_offs=())
    assert this_month(ledger, i)["expectedIncomePaise"] == 9_500_000


def test_one_off_income_is_not_counted_as_received(inp):
    ledger, i = synthetic(inp, [("2026-09-02", 12_000_000, "BONUS"), ("2026-09-02", 5_000_000, "SAL")],
                          as_of=date(2026, 9, 20), monthly_income=(1,), recurring=(),
                          one_offs=({"merchant": "BONUS", "date": "2026-09-02", "paise": 12_000_000},))
    assert this_month(ledger, i)["incomeReceivedPaise"] == 5_000_000


def test_overspent_month_gives_zero_safe_and_a_note(inp):
    ledger, i = synthetic(inp, [("2026-09-02", -9_000_000, "SHOP")], as_of=date(2026, 9, 10), monthly_income=(5_000_000,),
                          recurring=(), one_offs=())
    t = this_month(ledger, i)
    assert t["moneyLeftPaise"] < 0 and t["weeklySafeToSpendPaise"] == 0 and "below zero" in t["note"]


def test_end_of_month_sliver_is_one_week_not_less(inp):
    ledger, i = synthetic(inp, [("2026-09-01", 7_000_000, "S")], as_of=date(2026, 9, 29), monthly_income=(7_000_000,),
                          recurring=(), one_offs=())
    assert this_month(ledger, i)["weeklySafeToSpendPaise"] == 7_000_000


def test_due_dates_by_cadence():
    weekly = {"last_seen": "2026-09-28", "cadence_days": 7}
    assert [d.isoformat() for d in due_dates(weekly, date(2026, 9, 28), date(2026, 10, 12))] == ["2026-10-05", "2026-10-12"]
    monthly_end = {"last_seen": "2026-01-31", "cadence_days": 30}
    assert due_dates(monthly_end, date(2026, 1, 31), date(2026, 2, 28)) == [date(2026, 2, 28)]
    yearly = {"last_seen": "2024-02-29", "cadence_days": 365}
    assert due_dates(yearly, date(2024, 3, 1), date(2025, 12, 31)) == [date(2025, 2, 28)]


def test_upcoming_payments_in_seven_days(complete):
    items = get(complete, "/api/dashboard").json()["upcoming"]
    assert [(i["merchant"], i["dueDate"], i["daysAway"]) for i in items] == [("RENT", "2026-10-01", 3), ("SPOTIFY INDIA", "2026-10-05", 7)]
    assert items[0]["amountPaise"] == 2_800_000          # EMI on 7 Oct is 9 days away: not listed


# ---------- trends ----------

def test_trends_months_and_best_toughest(complete):
    t = get(complete, "/api/trends").json()
    assert [m["month"] for m in t["months"]] == ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]
    assert all(m["surplusPaise"] == m["inflowPaise"] - m["outflowPaise"] for m in t["months"])
    s = t["summary"]
    assert s["best"]["surplusPaise"] == max(m["surplusPaise"] for m in t["months"])
    assert s["toughest"]["month"] == "2026-06" and "CROMA" in s["toughest"]["reason"]      # the Rs 82,000 purchase
    assert s["averageSurplusPaise"] == median(m["surplusPaise"] for m in t["months"])


def test_category_trends_are_vs_three_month_median(complete):
    t = get(complete, "/api/trends").json()
    assert sum(c["thisMonthPaise"] for c in t["categories"]) == t["months"][-1]["outflowPaise"]   # nothing lost
    for c in t["categories"]:
        assert c["thisMonthPaise"] == c["sparklinePaise"][-1] and len(c["sparklinePaise"]) == 8
        baseline = c["sparklinePaise"][-4:-1]
        if c["name"] == "Shopping":                       # June holds the flagged ₹82,000 Croma one-off: left out of "usual"
            baseline = [baseline[0] - 8_200_000, *baseline[1:]]
        assert c["medianPaise"] == int(median(baseline))
        if c["medianPaise"]:
            assert c["changePct"] == round((c["thisMonthPaise"] / c["medianPaise"] - 1) * 100, 1)
            assert c["direction"] == ("flat" if abs(c["changePct"]) <= 5 else "up" if c["changePct"] > 0 else "down")


def test_trend_sentences_and_findings(complete):
    t = get(complete, "/api/trends").json()
    cats = {c["name"]: c for c in t["categories"]}
    assert cats["Rent"]["direction"] == "flat" and "steady" in cats["Rent"]["insight"]
    assert cats["Subscriptions"]["direction"] == "up" and "above your usual" in cats["Subscriptions"]["insight"]
    assert t["findings"][0] == "Surplus was positive in 5 of the last 6 months."
    assert any("Subscriptions" in f for f in t["findings"])                                  # the rising category
    assert any("one-off" in f and "BONUS" in f for f in t["findings"])


def test_trends_flag_insufficient_history(client):
    client.post("/api/demo-data?set=short_2mo")
    t = get(client, "/api/trends").json()
    assert t["insufficientHistory"] is True and t["categories"] == [] and t["monthsAvailable"] == 2


# ---------- money flow ----------

def test_money_flow_graph_is_consistent(complete):
    f = get(complete, "/api/money-flow").json()
    nodes = {n["id"]: n for n in f["nodes"]}
    assert {n["column"] for n in f["nodes"]} == {0, 1, 2, 3}
    assert not any("TRANSFER" in n["name"].upper() for n in f["nodes"])                  # own transfers excluded
    into = lambda nid: sum(l["valuePaise"] for l in f["links"] if l["to"] == nid)
    for n in f["nodes"]:
        if n["column"] in (1, 2):
            assert n["amountPaise"] == into(n["id"]) or n["column"] == 1                # money in = node size
    assert sum(n["amountPaise"] for n in f["nodes"] if n["column"] == 2) == f["spendPaise"]
    assert sum(l["valuePaise"] for l in f["links"] if l["from"].startswith("src:")) == f["incomePaise"]
    assert all(l["from"] in nodes and l["to"] in nodes for l in f["links"])


def test_money_flow_totals_match_the_dashboard(complete):
    f = get(complete, "/api/money-flow", month="2026-09").json()
    latest = get(complete, "/api/dashboard").json()["latestMonth"]
    assert (f["incomePaise"], f["spendPaise"]) == (latest["inflowPaise"], latest["outflowPaise"])


def test_top_n_keeps_the_biggest_merchants(complete):
    f = get(complete, "/api/money-flow", month="2026-09", top_n=2).json()
    shown = {n["name"] for n in f["nodes"] if n["column"] == 3}
    tx = get(complete, "/api/transactions", date_from="2026-09-01", date_to="2026-09-30", limit=500).json()["transactions"]
    spend = {}
    for t in tx:
        if t["amountPaise"] < 0 and t["kind"] == "normal":
            spend[t["merchant"]] = spend.get(t["merchant"], 0) - t["amountPaise"]
    assert shown == set(sorted(spend, key=spend.get, reverse=True)[:2])


def test_default_category_is_not_a_fixed_cost(complete):
    assert get(complete, "/api/money-flow").json()["selectedCategory"]["name"] not in ("Rent", "EMI")


def test_drivers_name_the_new_merchant_with_contribution(complete):
    for compare in ("prev", "median"):
        c = get(complete, "/api/money-flow", month="2026-09", category="Subscriptions", compare=compare).json()["selectedCategory"]
        assert c["amountPaise"] == 256_300 and c["newMerchants"] == ["STRIPE CURSOR AI"]
        top = c["drivers"][0]
        assert (top["merchant"], top["contributionPct"], top["deltaPaise"]) == ("STRIPE CURSOR AI", 100, 172_000)
    assert c["concentration"]["top3SharePct"] == 97 and "STRIPE CURSOR AI" in c["concentration"]["tip"]


def test_driver_contributions_never_exceed_100(complete):
    c = get(complete, "/api/money-flow", month="2026-09", category="Food & Dining", compare="prev").json()["selectedCategory"]
    assert 0 < sum(d["contributionPct"] for d in c["drivers"]) <= 100 + len(c["drivers"])   # rounding slack
    assert c["changePct"] == round((c["amountPaise"] / c["baselinePaise"] - 1) * 100, 1)


def test_money_flow_flags_short_history_and_rejects_bad_input(complete):
    early = get(complete, "/api/money-flow", month="2026-03").json()
    assert early["insufficientHistory"] is True and early["selectedCategory"]["drivers"] == []
    assert get(complete, "/api/money-flow", month="2026-09").json()["insufficientHistory"] is False
    assert get(complete, "/api/money-flow", month="2025-01").status_code == 422
    assert get(complete, "/api/money-flow", category="Nope").status_code == 422
    assert get(complete, "/api/money-flow", compare="bad").status_code == 422


# ---------- surplus plan ----------

def test_emergency_fund_is_three_months_of_essentials(complete):
    p = get(complete, "/api/surplus-plan").json()["emergencyFund"]
    assert p["monthlyEssentialsPaise"] == sum(e["monthlyPaise"] for e in p["essentials"])
    assert p["targetPaise"] == 3 * p["monthlyEssentialsPaise"]
    assert {e["name"] for e in p["essentials"]} <= {"Rent", "EMI", "Bills & Utilities", "Groceries", "Travel & Commute", "Fuel"}
    assert p["funded"] is True and p["monthsCovered"] > 3


def test_eta_to_fund_uses_low_and_high_surplus(complete, db_path):
    inp = build_inputs(connect(db_path), 1)
    from app.services.insights import load_ledger
    ledger = load_ledger(connect(db_path), 1)
    plan = surplus_plan(ledger, replace(inp, start_cash=1_000_000), split=50)
    gap = plan["emergencyFund"]["shortfallPaise"]
    assert gap == plan["emergencyFund"]["targetPaise"] - 1_000_000 > 0
    assert plan["eta"]["fastestMonths"] == ceil(gap / plan["surplus"]["highPaise"])
    assert plan["eta"]["slowestMonths"] == ceil(gap / plan["surplus"]["lowPaise"])
    chosen = plan["allocation"]["chosen"]
    assert chosen["monthlyToEmergencyPaise"] + chosen["monthlyToOtherGoalsPaise"] == plan["surplus"]["typicalPaise"]
    assert chosen["monthsToFund"] == ceil(gap / chosen["monthlyToEmergencyPaise"])
    assert [p["splitPct"] for p in plan["allocation"]["presets"]] == [100, 75, 60, 50, 25]


def test_months_to_fund_edge_cases():
    assert months_to_fund(0, 0) == 0 and months_to_fund(100, 0) is None and months_to_fund(100, -5) is None
    assert months_to_fund(101, 50) == 3


def test_surplus_plan_is_educational_and_names_no_products(complete):
    p = get(complete, "/api/surplus-plan").json()
    assert "not advice" in p["disclaimer"]
    text = json.dumps(p["options"]).upper()
    for word in ("PPF", "NPS", "ELSS", "MUTUAL", "SIP", " FD", " RD", "GOLD", "STOCK", "CRYPTO", "NIFTY"):
        assert word not in text
    assert get(complete, "/api/surplus-plan", split=150).status_code == 422


def test_surplus_plan_without_history(client):
    assert get(client, "/api/surplus-plan").json()["insufficientHistory"] is True


# ---------- goals ----------

def goal(name="Phone", target=8_000_000, saved=0, date_="2026-12-31"):
    return {"name": name, "targetPaise": target, "savedPaise": saved, "targetDate": date_}


def by_name(client):
    return {g["name"]: g for g in client.get("/api/goals").json()["goals"]}


def test_months_left():
    as_of = date(2026, 9, 28)
    assert months_left(as_of, "2026-12-31") == 3 and months_left(as_of, "2026-10-15") == 1
    assert months_left(as_of, "2026-09-30") == 0 and months_left(as_of, "2025-01-01") == 0


def test_goal_crud_and_numbers(complete):
    assert complete.post("/api/goals", json=goal()).status_code == 201
    g = by_name(complete)["Phone"]
    assert g["remainingPaise"] == 8_000_000 and g["monthsLeft"] == 3 and g["monthlyNeededPaise"] == ceil(8_000_000 / 3)
    gid = g["id"]
    upd = complete.put(f"/api/goals/{gid}", json=goal(saved=5_000_000)).json()["goals"][0]
    assert upd["percentFunded"] == 62.5 and upd["monthlyNeededPaise"] == 1_000_000
    assert complete.delete(f"/api/goals/{gid}").json()["goals"] == []
    assert complete.put("/api/goals/999", json=goal()).status_code == 404
    assert complete.delete("/api/goals/999").status_code == 404


def test_goal_validation(complete):
    assert complete.post("/api/goals", json=goal(date_="2026-13-01")).status_code == 422
    assert complete.post("/api/goals", json=goal(date_="2026-12")).status_code == 422
    assert complete.post("/api/goals", json=goal(target=0)).status_code == 422
    assert complete.post("/api/goals", json=goal(name="")).status_code == 422
    assert complete.post("/api/goals", json=goal(saved=-1)).status_code == 422


def test_status_comes_from_the_affordability_engine(complete):
    complete.post("/api/goals", json=goal("Phone", 8_000_000))
    complete.post("/api/goals", json=goal("Villa", 200_000_000))
    complete.post("/api/goals", json=goal("Done", 1_000_000, saved=1_000_000))
    complete.post("/api/goals", json=goal("Late", 1_000_000, saved=0, date_="2026-09-30"))
    g = by_name(complete)
    assert g["Phone"]["status"] == "on_track" and g["Phone"]["verdict"] == "yes"
    assert g["Villa"]["status"] == "off_track" and g["Villa"]["verdict"] == "no"
    assert g["Done"]["status"] == "funded" and g["Late"]["status"] == "overdue"
    s = complete.get("/api/goals").json()["summary"]
    assert s["count"] == 4 and s["targetPaise"] == 8_000_000 + 200_000_000 + 1_000_000 + 1_000_000


def test_goals_share_one_pot_of_cash(complete):
    worst_dec = ask_headroom(complete, "2026-12", "worst")
    best_dec = ask_headroom(complete, "2026-12", "best")
    first = ask_headroom(complete, "2026-11", "worst") // 2
    assert first > best_dec - worst_dec                              # so first + second overshoots even the best case
    complete.post("/api/goals", json=goal("Second", worst_dec, date_="2026-12-31"))
    assert by_name(complete)["Second"]["status"] == "on_track"       # fine on its own
    complete.post("/api/goals", json=goal("First", first, date_="2026-11-30"))
    g = by_name(complete)
    assert g["First"]["status"] == "on_track" and g["Second"]["status"] == "off_track"   # not with First as well


def test_preview_does_not_save(complete):
    r = complete.post("/api/goals/preview", json=goal("Chair", 3_500_000, saved=1_000_000, date_="2026-12-31")).json()
    assert r["monthlyNeededPaise"] == ceil(2_500_000 / 3) and r["status"] == "on_track" and r["id"] is None
    assert complete.get("/api/goals").json()["goals"] == []


def test_goal_status_unknown_when_data_is_insufficient(client):
    client.post("/api/demo-data?set=short_2mo")
    client.post("/api/goals", json=goal("Phone", 8_000_000, date_="2027-03-31"))
    g = by_name(client)["Phone"]
    assert g["status"] == "unknown" and [m["code"] for m in g["missing"]] == ["HISTORY"]
    assert g["monthlyNeededPaise"] > 0                                   # the arithmetic still works


def test_safe_to_spend_runs_until_next_salary_after_bills_due_before_it(inp):
    """Salary on the 28th: the week figure covers 28 Sep -> 28 Oct and first pays the rent due on 1 Oct."""
    ledger = [{"month": "2026-09", "txn_date": "2026-09-28", "amount_paise": 9_000_000, "merchant": "ACME", "category": "Salary"}]
    rent = {"merchant": "RENT", "label": "rent", "typical_paise": -2_000_000, "cadence_days": 30, "last_seen": "2026-09-01"}
    i = replace(inp, as_of=date(2026, 9, 28), monthly_income=(9_000_000,), recurring=(rent,), one_offs=(), start_cash=50_000_000)
    t = this_month(ledger, i)
    assert t["nextSalary"] == "2026-10-28" and t["committedBeforeSalaryPaise"] == 2_000_000
    assert t["moneyLeftPaise"] == 9_000_000                                             # rent on 1 Oct is not this month
    assert t["weeklySafeToSpendPaise"] == round((9_000_000 - 2_000_000) / (30 / 7))


def test_safe_to_spend_never_eats_into_the_buffer(inp):
    ledger = [{"month": "2026-09", "txn_date": "2026-09-01", "amount_paise": 9_000_000, "merchant": "S", "category": "X"}]
    rent = {"merchant": "RENT", "label": "rent", "typical_paise": -3_000_000, "cadence_days": 30, "last_seen": "2026-08-25"}
    i = replace(inp, as_of=date(2026, 9, 2), monthly_income=(9_000_000,), recurring=(rent,), one_offs=(), start_cash=7_000_000)
    t = this_month(ledger, i)                       # cash 70k - rent still due 30k - buffer 30k = only 10k may be spent
    assert t["weeklySafeToSpendPaise"] == round(1_000_000 / (28 / 7))


def test_last_month_surplus_is_the_month_before_the_current_one(complete):
    d = get(complete, "/api/dashboard").json()
    aug = get(complete, "/api/transactions", date_from="2026-08-01", date_to="2026-08-31").json()["summary"]
    assert d["thisMonth"]["month"] == "2026-09" and d["previousMonth"]["month"] == "2026-08"
    assert d["previousMonth"]["surplusPaise"] == aug["inflowPaise"] - aug["outflowPaise"]


def test_flagged_large_purchase_is_left_out_of_the_usual_baseline(inp):
    """A one-off ₹82,000 TV in the baseline months must not make next month's normal shopping look 'down'."""
    from app.services.insights import category_trends
    months = ["2026-05", "2026-06", "2026-07", "2026-08"]
    row = lambda d, p, anomaly=False: {"month": d[:7], "txn_date": d, "amount_paise": p, "merchant": "M", "category": "Shopping", "anomaly": anomaly}
    ledger = [row("2026-05-10", -300_000), row("2026-06-10", -300_000), row("2026-06-14", -8_200_000, anomaly=True),
              row("2026-07-10", -300_000), row("2026-08-10", -300_000)]
    (shop,) = category_trends(ledger, months)
    assert shop["medianPaise"] == 300_000 and shop["direction"] == "flat"
    assert shop["sparklinePaise"][1] == 8_500_000                       # June still shows what really happened


def test_rupee_text_uses_the_rupee_sign_and_indian_grouping():
    from app.services.money import inr
    assert [inr(p) for p in (0, 50_000, 12_000_000, 8_200_000_00, -149_900)] == ["₹0", "₹500", "₹1,20,000", "₹82,00,000", "-₹1,499"]


def test_no_rs_left_in_backend_sentences(complete):
    import json
    text = json.dumps([get(complete, p).json() for p in ("/api/trends", "/api/flags", "/api/dashboard")], ensure_ascii=False)
    assert "Rs " not in text and "₹" in text
