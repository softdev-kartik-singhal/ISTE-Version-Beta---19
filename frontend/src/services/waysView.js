// Shapes /api/ways-to-use-money for the page: money in rupees, everything else as the server sent it.
import { r } from './adapters';

export function toWays(w) {
  const b = w.base;
  return {
    rates: w.rates,
    base: { saved: r(b.savedPaise), spare: r(b.spareAboveSafetyNetPaise), shortfall: r(b.shortfallPaise), funded: b.funded, leftover: r(b.monthlyLeftoverPaise) },
    fd: {
      amount: r(w.fd.amountPaise), interest: r(w.fd.interestYearPaise), idleInterest: r(w.fd.savingsInterestPaise), extra: r(w.fd.extraPaise), total: r(w.fd.totalAfterYearPaise),
    },
    rd: {
      monthly: r(w.rd.monthlyPaise), sharePct: w.rd.sharePct, months: w.rd.months, deposited: r(w.rd.depositedPaise), interest: r(w.rd.interestPaise), total: r(w.rd.totalPaise),
      fillsNetInMonths: w.rd.fillsSafetyNetInMonths,
    },
    policy: {
      lifeCover: r(w.policy.lifeCoverPaise), coverYears: w.policy.coverYears, hasLife: w.policy.hasLifePremium, hasHealth: w.policy.hasHealthPremium,
      exampleBill: r(w.policy.exampleBillPaise), billShare: w.policy.billShareOfSavingsPct,
    },
  };
}
