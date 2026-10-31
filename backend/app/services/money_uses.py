"""Ways to use money: what a fixed deposit, a recurring deposit and insurance could do for THIS user's numbers.

Everything is arithmetic on the user's own statements plus a few labelled example assumptions (the rates, the share of
the leftover, the cover rule of thumb, the example hospital bill). The rates are examples the user can change, not offers.
No product, bank or insurer is named and no return is promised.
"""
import math

from app import config
from app.services.suggest_profile import has_signal
from app.services.surplus_plan import surplus_plan


def fd_interest(principal, rate_pct, years=1):
    """Interest a fixed deposit would earn over `years`, compounded yearly."""
    return round(principal * ((1 + rate_pct / 100) ** years - 1))


def rd_value(monthly, rate_pct, months=12):
    """What a recurring deposit of `monthly` for `months` grows to (monthly compounding, deposit at each month end)."""
    i = rate_pct / 1200
    if i == 0:
        return round(monthly * months)
    return round(monthly * (((1 + i) ** months - 1) / i))


def ways_to_use_money(ledger, inp, fd_rate=None, rd_rate=None):
    """GET /api/ways-to-use-money payload. Money in paise; rates in % per year."""
    plan = surplus_plan(ledger, inp)
    if plan["insufficientHistory"]:
        return {"insufficientHistory": True}
    fd_rate = config.EXAMPLE_FD_RATE_PCT if fd_rate is None else fd_rate
    rd_rate = config.EXAMPLE_RD_RATE_PCT if rd_rate is None else rd_rate
    fund, leftover = plan["emergencyFund"], plan["surplus"]["typicalPaise"]
    saved, target = max(0, fund["savedPaise"]), fund["targetPaise"]
    spare = max(0, saved - target)                                  # cash above the safety net
    months = set(list(inp.history_months)[-config.SIGNAL_MONTHS:])

    # Fixed deposit: only the cash above the safety net is "free" to park; the net itself must stay easy to reach.
    earn = fd_interest(spare, fd_rate)
    idle = fd_interest(spare, config.EXAMPLE_SAVINGS_RATE_PCT)
    fd = {"amountPaise": spare, "interestYearPaise": earn, "savingsInterestPaise": idle, "extraPaise": earn - idle,
          "totalAfterYearPaise": spare + earn}

    # Recurring deposit: part of the usual monthly leftover, put aside each month for a year.
    monthly = max(0, round(leftover * config.RD_SHARE_PCT / 100))
    value = rd_value(monthly, rd_rate)
    rd = {"monthlyPaise": monthly, "sharePct": config.RD_SHARE_PCT, "months": 12, "depositedPaise": monthly * 12,
          "interestPaise": value - monthly * 12, "totalPaise": value,
          "fillsSafetyNetInMonths": None if fund["funded"] or monthly <= 0 else math.ceil(fund["shortfallPaise"] / monthly)}

    # Insurance protects against a shock rather than earning interest: show what is at stake, from the user's own figures.
    annual_essentials = fund["monthlyEssentialsPaise"] * 12
    bill = config.EXAMPLE_HOSPITAL_BILL_PAISE
    policy = {"annualEssentialsPaise": annual_essentials, "coverYears": config.COVER_YEARS_OF_ESSENTIALS,
              "lifeCoverPaise": annual_essentials * config.COVER_YEARS_OF_ESSENTIALS,
              "hasLifePremium": has_signal(ledger, months, config.LIFE_INSURANCE_WORDS),
              "hasHealthPremium": has_signal(ledger, months, config.HEALTH_INSURANCE_WORDS),
              "exampleBillPaise": bill, "billShareOfSavingsPct": round(bill * 100 / saved) if saved else None}

    return {"insufficientHistory": False,
            "base": {"savedPaise": saved, "targetPaise": target, "spareAboveSafetyNetPaise": spare, "shortfallPaise": fund["shortfallPaise"],
                     "funded": fund["funded"], "monthlyLeftoverPaise": leftover},
            "rates": {"fd": fd_rate, "rd": rd_rate, "savings": config.EXAMPLE_SAVINGS_RATE_PCT},
            "fd": fd, "rd": rd, "policy": policy}
