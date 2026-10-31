// Shapes /api/survival for the job-loss planner: money in rupees, ids and names ready to show.
import { r, title } from './adapters';

// Subscription names come from bank narrations in capitals ("NETFLIX.COM"); categories already read well.
const nice = (cut) => (cut.kind === 'subscription' ? title(cut.name) : cut.name === 'Other' ? 'Other spending' : cut.name);

export function toSurvival(s) {
  return {
    asOf: s.asOf,
    cash: r(s.cashPaise),
    spend: r(s.monthlySpendPaise),
    monthsNow: s.monthsNow,
    leanSpend: r(s.leanMonthlySpendPaise),
    monthsLean: s.monthsLean,
    essentials: s.essentials.map((e) => ({ name: e.name, monthly: r(e.monthlyPaise) })),
    cuts: s.cuts.map((c) => ({ id: c.id, kind: c.kind, name: nice(c), monthly: r(c.monthlyPaise), addsMonths: c.addsMonths })),
  };
}
