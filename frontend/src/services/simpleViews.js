// Shapes for the four simple main tabs (Home, Spending, Plan) built from the same backend responses the detailed
// screens use. Pure functions, no fetching. Money comes in as paise and leaves as rupees.
import { catIcon, monthLabel, monthShort, r, title } from './adapters';
import { compactMoney, rounded } from '../utils/money';

const FIXED = ['Rent', 'EMI']; // the same every month, so never the interesting part of "this month vs usual"
const USUAL_BAND_PCT = 5; // within ±5% of usual counts as "usual" (the backend's TREND_FLAT_PCT)

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const addMonths = (ym, k) => {
  const d = new Date(`${ym}-01T00:00:00`);
  d.setMonth(d.getMonth() + k);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const dayOf = (iso) => new Date(`${iso.slice(0, 10)}T00:00:00`);

// 'more' | 'less' | 'usual' | null (null = not enough earlier months to know what is usual)
export function compareTag(amount, usual) {
  if (usual == null) return null;
  if (!usual) return amount > 0 ? 'more' : 'usual';
  const pct = ((amount - usual) / usual) * 100;
  return pct > USUAL_BAND_PCT ? 'more' : pct < -USUAL_BAND_PCT ? 'less' : 'usual';
}

// ---------- Home ----------

// d: /api/dashboard   t: /api/trends (may be insufficient)   flags: /api/flags
export function toHome(d, t, flags) {
  const tm = d.thisMonth;
  const proj = d.projection || [];
  const cats = t.insufficientHistory ? [] : t.categories;

  // Status: tight beats "faster", which beats "on track".
  const lowestUsual = proj.length ? Math.min(...proj.map((w) => w.typical)) : null;
  const tight = tm.moneyLeftPaise < 0 || (lowestUsual != null && lowestUsual < d.bufferPaise);
  const usualSpend = cats.reduce((s, c) => s + c.medianPaise, 0);
  const dayOfMonth = dayOf(d.asOf).getDate();
  const pace = (tm.spentSoFarPaise / dayOfMonth) * (dayOfMonth + tm.daysLeft); // spending so far, stretched to the whole month
  const faster = usualSpend > 0 && pace > usualSpend * (1 + USUAL_BAND_PCT * 2 / 100);
  const status = tight ? 'tight' : faster ? 'faster' : 'ok';

  const comingUp = d.upcoming.slice(0, 3).map((u) => ({
    id: `${u.merchant}-${u.dueDate}`,
    name: title(u.merchant),
    amount: r(u.amountPaise),
    when: u.daysAway < 7 ? dayOf(u.dueDate).toLocaleDateString('en-GB', { weekday: 'short' }) : dayOf(u.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }));

  // The one tip: the category that grew the most in rupees; otherwise the biggest saving; otherwise a nudge for more data.
  const changes = cats.filter((c) => c.thisMonthPaise > 0 && c.medianPaise >= 0).map((c) => ({ c, delta: c.thisMonthPaise - c.medianPaise }));
  const up = changes.filter((x) => compareTag(x.c.thisMonthPaise, x.c.medianPaise) === 'more').sort((a, b) => b.delta - a.delta)[0];
  const down = changes.filter((x) => compareTag(x.c.thisMonthPaise, x.c.medianPaise) === 'less').sort((a, b) => a.delta - b.delta)[0];
  let tip;
  if (up) {
    const who = up.c.merchants[0] ? `, mostly ${title(up.c.merchants[0])}` : '';
    tip = { tone: 'more', text: `${up.c.name} is ${rounded(r(up.delta))} more than usual${who}.`, action: { label: 'See payments', to: '/spending', state: { month: t.categoryMonth, category: up.c.name } } };
  } else if (down) {
    tip = { tone: 'less', text: `${down.c.name} is ${rounded(r(-down.delta))} less than usual. Nice.`, action: { label: 'See spending', to: '/spending', state: { month: t.categoryMonth, category: down.c.name } } };
  } else {
    tip = { tone: 'info', text: 'Add more months of statements to see how this month compares.', action: { label: 'Add statements', to: '/statements' } };
  }

  const bars = cats
    .filter((c) => !FIXED.includes(c.name) && c.thisMonthPaise > 0)
    .sort((a, b) => b.thisMonthPaise - a.thisMonthPaise)
    .slice(0, 4)
    .map((c) => ({ name: c.name, icon: catIcon(c.name), thisMonth: r(c.thisMonthPaise), usual: r(c.medianPaise), tag: compareTag(c.thisMonthPaise, c.medianPaise) }));

  // Balance range at month end: the projected week that contains the last day of this month.
  const monthEnd = new Date(dayOf(d.asOf).getFullYear(), dayOf(d.asOf).getMonth() + 1, 0);
  const week = proj.find((w) => monthEnd >= dayOf(w.weekStart) && monthEnd < new Date(dayOf(w.weekStart).getTime() + 7 * 864e5)) || proj[0];
  const monthEndRange = week ? { low: r(week.worst), high: r(week.best), text: `${compactMoney(r(week.worst))}–${compactMoney(r(week.best))}` } : null;

  return {
    moneyLeft: r(tm.moneyLeftPaise),
    daysLeft: tm.daysLeft,
    status,
    comingUp,
    tip,
    openFlags: flags.openCount,
    bars,
    barsMonth: t.categoryMonth ? monthLabel(t.categoryMonth) : null,
    monthEndRange,
    asOf: d.asOf,
  };
}

// ---------- Spending ----------

// t: /api/trends   txs: /api/transactions list. Every category's history lines up with the months ending at t.categoryMonth.
export function toSpending(t, txs) {
  const n = Math.max(0, ...t.categories.map((c) => c.sparklinePaise.length));
  const months = Array.from({ length: n }, (_, i) => addMonths(t.categoryMonth, i - n + 1));
  const debits = txs
    .filter((x) => x.kind !== 'transfer' && x.amountPaise < 0)
    .map((x) => ({ month: x.date.slice(0, 7), category: x.category || 'Other', merchant: title(x.merchant || x.description), amount: r(-x.amountPaise) }));

  const byMonth = Object.fromEntries(
    months.map((m, i) => [
      m,
      t.categories
        .map((c) => {
          const series = c.sparklinePaise.slice(-n);
          const k = i - (n - series.length);
          if (k < 0 || !series[k]) return null;
          const prior = series.slice(Math.max(0, k - 3), k);
          const usual = prior.length === 3 ? median(prior) : null;
          return {
            name: c.name,
            icon: catIcon(c.name),
            amount: r(series[k]),
            usual: usual == null ? null : r(usual),
            tag: compareTag(series[k], usual),
            history: series.slice(Math.max(0, k - 5), k + 1).map((v, j, arr) => ({ month: monthShort(addMonths(m, j - arr.length + 1)), amount: r(v) })),
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.amount - a.amount),
    ]),
  );

  return { months, latest: t.categoryMonth, byMonth, debits };
}

// Merchants in one category for one month, biggest first.
export function merchantsFor(debits, month, category) {
  const totals = {};
  for (const x of debits) {
    if (x.month !== month || x.category !== category) continue;
    totals[x.merchant] = totals[x.merchant] || { name: x.merchant, amount: 0, count: 0 };
    totals[x.merchant].amount += x.amount;
    totals[x.merchant].count += 1;
  }
  return Object.values(totals).sort((a, b) => b.amount - a.amount);
}

// ---------- Plan ----------

// d: /api/dashboard   g: /api/goals   p: /api/surplus-plan
export function toPlan(d, g, p) {
  const f = p.emergencyFund;
  const toFund = p.allocation.chosen.monthlyToEmergencyPaise;
  const etaMonths = p.eta.slowestMonths;
  const by = (months) => monthLabel(addMonths(d.asOf.slice(0, 7), months));
  return {
    leftover: { amount: r(d.latestMonth.surplusPaise), month: monthLabel(d.latestMonth.month) },
    emergency: {
      percent: f.targetPaise ? (f.savedPaise / f.targetPaise) * 100 : 0,
      line: f.funded
        ? `Done: your cash covers ${f.monthsCovered} months of essentials`
        : etaMonths == null
          ? `${rounded(r(f.shortfallPaise))} still to go`
          : `${rounded(r(toFund))}/month to reach by ${by(etaMonths)}`,
      target: r(f.targetPaise),
      saved: r(f.savedPaise),
    },
    goals: g.goals.map((x) => ({
      id: x.id,
      name: x.name,
      percent: x.percentFunded,
      offTrack: ['off_track', 'overdue'].includes(x.status),
      line: x.status === 'funded' ? 'Reached' : `${rounded(r(x.monthlyNeededPaise))}/month to reach by ${monthLabel(x.targetDate.slice(0, 7))}`,
    })),
    options: p.options.map((o) => ({ title: o.title, risk: o.risk.split(':')[0], riskDetail: o.risk, lockIn: o.lockIn, bestFor: o.bestFor })),
    disclaimer: p.disclaimer,
  };
}
