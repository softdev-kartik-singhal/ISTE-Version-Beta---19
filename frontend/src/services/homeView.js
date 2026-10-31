// Shapes the Home page from /api/dashboard, /api/trends and /api/flags. Pure functions, no fetching.
// Money arrives in paise and leaves in rupees. "Usual" category amounts come from the backend, which already
// leaves flagged one-off large payments out of them.
import { catIcon, dayShort, monthLabel, monthName, monthShort, r, suggestions, title } from './adapters';

const PALETTE = ['#1d4ed8', '#0b2545', '#60a5fa', '#0d9488', '#f59e0b', '#7c3aed', '#94a3b8'];
const date = (iso) => new Date(`${iso.slice(0, 10)}T00:00:00`);
const nextMonthLabel = (ym) => {
  const d = date(`${ym}-01`);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString('en-GB', { month: 'long' });
};

// 'ok' | 'tight' | 'faster', from the same data the cards show.
function statusOf(d, usualSpend) {
  const tm = d.thisMonth;
  const proj = d.projection || [];
  const lowestUsual = proj.length ? Math.min(...proj.map((w) => w.typical)) : null;
  if (tm.moneyLeftPaise < 0 || (lowestUsual != null && lowestUsual < d.bufferPaise)) return 'tight';
  const day = date(d.asOf).getDate();
  const pace = (tm.spentSoFarPaise / day) * (day + tm.daysLeft); // this month's spending, stretched to the whole month
  return usualSpend > 0 && pace > usualSpend * 1.1 ? 'faster' : 'ok';
}

export function toHome(d, t, f) {
  const tm = d.thisMonth;
  const cats = t.insufficientHistory ? [] : t.categories;
  const usualSpend = cats.reduce((s, c) => s + c.medianPaise, 0);
  const months = (t.months || []).slice(-6);
  const proj = d.projection || [];
  const status = statusOf(d, usualSpend);
  const pm = d.previousMonth;

  // ---- hero ----
  const spentPct = usualSpend ? Math.round((tm.spentSoFarPaise / usualSpend) * 100) : null;
  const hero = {
    status,
    moneyLeft: r(tm.moneyLeftPaise),
    month: monthName(tm.month),
    daysLeft: tm.daysLeft,
    spent: r(tm.spentSoFarPaise),
    usualSpend: r(usualSpend),
    spentPct,
    asOfIso: d.asOf,
    asOf: date(d.asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    uploadMonth: nextMonthLabel(tm.month),
    ageDays: Math.max(0, Math.round((Date.now() - date(d.asOf).getTime()) / 86400000)), // how old the newest statement row is, today
    ...suggestions(d.planningSurplusPaise),
  };

  // ---- four key numbers ----
  const surplusSeries = months.map((m) => r(m.surplusPaise));
  const delta = d.previousVsBeforePaise;
  const keys = {
    safe: { value: r(tm.weeklySafeToSpendPaise), until: dayShort(tm.safeUntil), untilSalary: Boolean(tm.nextSalary), spark: proj.map((w) => r(w.typical)) },
    left: { value: r(tm.moneyLeftPaise), month: monthName(tm.month), daysLeft: tm.daysLeft, spark: surplusSeries },
    last: pm && {
      value: r(pm.surplusPaise), month: monthName(pm.month), spark: surplusSeries,
      delta: delta == null ? null : { up: delta >= 0, amount: r(Math.abs(delta)), vs: monthShort(addMonth(pm.month, -1)) },
    },
    due: { value: r(d.upcoming.reduce((s, u) => s + u.amountPaise, 0)), count: d.upcoming.length, spark: d.upcoming.map((u) => r(u.amountPaise)) },
  };

  // ---- coming up ----
  const comingUp = d.upcoming.map((u) => ({
    id: `${u.merchant}-${u.dueDate}`,
    name: title(u.merchant),
    amount: r(u.amountPaise),
    icon: u.label === 'rent' ? 'home' : u.label === 'emi' ? 'bank' : u.label === 'subscription' ? 'tv' : 'wallet',
    kind: { rent: 'Rent', emi: 'EMI', subscription: 'Subscription', bill: 'Bill' }[u.label] || 'Regular',
    weekday: date(u.dueDate).toLocaleDateString('en-GB', { weekday: 'short' }),
    day: date(u.dueDate).getDate(),
    date: dayShort(u.dueDate),
    daysAway: u.daysAway,
  }));

  // ---- what changed: biggest rupee moves vs usual, max 3, one plain headline each ----
  const changes = cats
    .filter((c) => c.thisMonthPaise > 0 && c.medianPaise > 0 && c.direction !== 'flat')
    .map((c) => ({ c, diff: c.thisMonthPaise - c.medianPaise }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3)
    .map(({ c, diff }) => ({
      id: c.name,
      icon: catIcon(c.name),
      up: diff > 0,
      headline: `${c.name} ${c.name.endsWith('s') ? 'are' : 'is'} ${formatRupee(r(Math.abs(diff)))} ${diff > 0 ? 'higher' : 'lower'} than usual`,
      now: r(c.thisMonthPaise),
      usual: r(c.medianPaise),
      category: c.name,
    }));

  // ---- spending donut ----
  const sp = d.spending;
  const top = sp.categories.slice(0, 6);
  const rest = sp.categories.slice(6).reduce((s, c) => s + c.amountPaise, 0);
  const spending = {
    month: monthName(sp.month),
    total: r(sp.totalPaise),
    slices: [...top.map((c, i) => ({ name: c.name, icon: catIcon(c.name), value: r(c.amountPaise), color: PALETTE[i] })),
      ...(rest > 0 ? [{ name: 'Everything else', icon: 'wallet', value: r(rest), color: PALETTE[6], all: true }] : [])],
  };

  // ---- 8-week forecast ----
  const forecast = proj.length
    ? {
        weeks: proj.map((w, i) => ({ label: i === 0 ? 'Today' : dayShort(w.weekStart), usual: r(w.typical), range: [r(w.worst), r(w.best)] })),
        low: r(Math.min(...proj.map((w) => w.worst))),
        high: r(Math.max(...proj.map((w) => w.best))),
        cushion: r(d.bufferPaise),
      }
    : null;

  // ---- monthly trend ----
  const totalIn = months.reduce((s, m) => s + m.inflowPaise, 0);
  const totalSaved = months.reduce((s, m) => s + m.surplusPaise, 0);
  const trend = {
    months: months.map((m) => ({ month: monthShort(m.month), in: r(m.inflowPaise), out: r(m.outflowPaise), saved: r(m.surplusPaise), bonus: m.oneOffPaise > 0 })),
    savedPct: totalIn ? Math.round((totalSaved / totalIn) * 100) : 0,
  };

  // ---- things to check: group repeats of the same kind at the same merchant ----
  const groups = new Map();
  for (const x of f.flags) {
    const key = `${x.type}|${x.merchant}`;
    if (!groups.has(key)) groups.set(key, { ...x, count: 0, ids: [] });
    const g = groups.get(key);
    g.count += 1;
    g.ids.push(x.id);
  }
  const checks = [...groups.values()].slice(0, 3).map((g) => ({
    id: g.id,
    ids: g.ids,
    type: g.type,
    title: { duplicate: 'Possible double charge', large: 'Unusually large payment', 'new-merchant': 'New shop' }[g.type],
    merchant: title(g.merchant),
    amount: r(g.amountPaise),
    count: g.count,
    reason: g.reason.replace(/\bmedian\b/gi, 'usual'),
  }));

  return { hero, keys, comingUp, changes, spending, forecast, trend, checks, openFlags: f.openCount, dataMonth: monthLabel(tm.month) };
}

function addMonth(ym, k) {
  const d = date(`${ym}-01`);
  d.setMonth(d.getMonth() + k);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatRupee(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
