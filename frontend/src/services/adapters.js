// Turns the backend's responses (money in paise, ISO dates) into the shapes the screens were built for
// (money in rupees, display strings). Pure functions: no fetching here.
import { formatCurrency } from '../utils/formatCurrency';

export const r = (paise) => paise / 100;
const date = (iso) => new Date(`${iso.slice(0, 10)}T00:00:00`);
export const day = (iso) => date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const dayShort = (iso) => date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const monthShort = (ym) => date(`${ym}-01`).toLocaleDateString('en-GB', { month: 'short' });
export const monthName = (ym) => date(`${ym}-01`).toLocaleDateString('en-GB', { month: 'long' });
export const monthLabel = (ym) => date(`${ym}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
export const title = (s) => (s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
export const prevMonth = (ym) => {
  const d = date(`${ym}-01`);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Server timestamps are UTC "YYYY-MM-DD HH:MM:SS".
const utc = (s) => new Date(`${s.replace(' ', 'T')}Z`);
export function ago(s) {
  const mins = Math.round((Date.now() - utc(s)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${plural(mins, 'min')} ago`;
  return utc(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
}

// Icon per category (keys from utils/icons.js) and a colour per chart slice.
const CAT_ICON = { Rent: 'home', EMI: 'bank', 'Bills & Utilities': 'bolt', Subscriptions: 'tv', 'Food & Dining': 'food', Groceries: 'grocery', 'Travel & Commute': 'car', Fuel: 'car', Shopping: 'shopping' };
export const catIcon = (name) => CAT_ICON[name] || 'wallet';
const PALETTE = ['#0037b0', '#1d4ed8', '#495f82', '#0d9488', '#b45309', '#7c3aed', '#be123c'];

// ---------- Dashboard ----------

// Question suggestions sized to the user's own surplus (rounded to the nearest ₹5,000), not fixed numbers.
function suggestions(planningPaise) {
  const nice = (f) => Math.max(5000, Math.round((r(planningPaise) * f) / 5000) * 5000);
  const money = (n) => formatCurrency(n);
  const [a, b, c] = [nice(0.6), nice(0.4), nice(1.2)];
  return {
    defaultQuestion: `Can I afford a ${money(a)} purchase next month?`,
    quickQuestions: [`Can I take a ${money(b)} trip in 2 months?`, `Can I afford a ${money(c)} laptop next month?`, `Can I afford a ${money(a)} phone in 3 months?`],
  };
}

export function toDashboard(d, trends, flags) {
  const tm = d.thisMonth;
  const upcoming = d.upcoming.map((u) => ({
    id: `${u.merchant}-${u.dueDate}`,
    icon: u.label === 'rent' ? 'home' : u.label === 'emi' ? 'bank' : u.label === 'subscription' ? 'tv' : 'wallet',
    name: title(u.merchant),
    badge: `Due in ${plural(u.daysAway, 'day')}`,
    badgeTone: u.daysAway <= 3 ? 'warning' : 'neutral',
    detail: `${title(u.label)} • Scheduled ${dayShort(u.dueDate)}`,
    amount: r(u.amountPaise),
    status: 'Auto-debit',
    statusIcon: 'clock',
  }));
  const pm = d.previousMonth; // the month before the statements' current month
  const delta = d.previousVsBeforePaise;
  const dataMonth = monthLabel(tm.month); // figures describe the statements' month, which may not be today's month
  const moves = (trends.categories || [])
    .filter((c) => ['up', 'down', 'new'].includes(c.direction) && c.thisMonthPaise > 0)
    .sort((a, b) => Math.abs(b.changePct ?? 999) - Math.abs(a.changePct ?? 999))
    .slice(0, 3);
  const changes = moves.length
    ? moves.map((c) => ({
        id: c.name, icon: catIcon(c.name), tone: c.direction === 'up' ? 'warning' : c.direction === 'down' ? 'positive' : 'neutral',
        badge: c.changePct == null ? 'New' : `${c.changePct > 0 ? '+' : ''}${Math.round(c.changePct)}%`, title: c.insight,
        detail: `${formatCurrency(r(c.thisMonthPaise))} in ${monthName(trends.categoryMonth)} against a usual ${formatCurrency(r(c.medianPaise))}.`,
      }))
    : [{ id: 'none', icon: 'info', tone: 'neutral', badge: '—', title: 'Comparisons start after 4 months of statements', detail: 'Once there is enough history, the biggest changes from your usual spending appear here.' }];
  const months = (trends.months || []).slice(-6);
  const totalIn = months.reduce((s, m) => s + m.inflowPaise, 0);
  const sp = d.spending;
  const cats = sp.categories.slice(0, 7);
  const proj = d.projection || [];
  return {
    ...suggestions(d.planningSurplusPaise),
    liquidity: {
      dataMonth, asOf: day(d.asOf), asOfIso: d.asOf,
      safeToSpendWeek: r(tm.weeklySafeToSpendPaise), safeUntil: dayShort(tm.safeUntil), untilSalary: Boolean(tm.nextSalary),
      moneyLeftMonth: r(tm.moneyLeftPaise), daysLeft: tm.daysLeft,
      lastMonth: pm ? monthLabel(pm.month) : null, lastMonthSurplus: pm ? r(pm.surplusPaise) : null,
      surplusVsPrev: !pm ? 'No earlier month on record' : delta == null ? 'First month on record' : `${delta >= 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(r(delta)))} ${delta >= 0 ? 'higher' : 'lower'} than ${monthShort(prevMonth(pm.month))}`,
      upcomingTotal: upcoming.reduce((s, u) => s + u.amount, 0), upcomingDebits: upcoming.length, mandates: upcoming.length,
    },
    upcoming,
    analyzedTransactions: d.analyzedTransactions,
    changes,
    projection: {
      runwayBuffer: r(d.bufferPaise),
      note: d.projection ? 'Typical case with a worst-to-best range. Income and spending are spread evenly across weeks.' : 'A projection needs 3 complete months of statements.',
      minRunway: proj.length ? `Lowest typical balance: ${formatCurrency(r(Math.min(...proj.map((w) => w.typical))))}` : '',
      weeks: proj.map((w, i) => ({ week: `W${i + 1} ${dayShort(w.weekStart)}`, median: r(w.typical), low: r(w.worst), high: r(w.best) })),
    },
    incomeVsSpending: {
      averageNetSavings: `${formatCurrency(r(months.reduce((s, m) => s + m.surplusPaise, 0) / Math.max(1, months.length)))}/mo`,
      savingsRate: `${totalIn ? ((months.reduce((s, m) => s + m.surplusPaise, 0) / totalIn) * 100).toFixed(1) : '0.0'}%`,
      months: months.map((m) => ({ month: monthShort(m.month), inflow: r(m.inflowPaise), outflow: r(m.outflowPaise) })),
    },
    spending: {
      month: monthName(sp.month), total: r(sp.totalPaise), categoryCount: sp.categories.length,
      split: `${sp.totalPaise ? Math.round((sp.flexiblePaise * 100) / sp.totalPaise) : 0}% Discretionary • ${sp.totalPaise ? Math.round((sp.fixedPaise * 100) / sp.totalPaise) : 0}% Fixed`,
      categories: cats.map((c, i) => ({ name: c.name, amount: r(c.amountPaise), color: PALETTE[i % PALETTE.length] })),
    },
    attention: {
      auditSync: `Latest statement: ${day(d.asOf)}`,
      items: flags.flags.slice(0, 3).map((f) => ({
        id: f.id, icon: f.type === 'duplicate' ? 'warning' : f.type === 'large' ? 'trending' : 'info', iconClass: 'text-tertiary',
        title: { duplicate: 'Possible duplicate charge', large: 'Unusually large spend', 'new-merchant': 'New merchant' }[f.type],
        amount: formatCurrency(r(f.amountPaise)), amountClass: 'text-error', text: [f.reason],
        primaryAction: { label: 'Review', to: '/flags' }, secondaryAction: 'Dismiss',
      })),
    },
  };
}

// ---------- Statements ----------

// Covered / gap / covered bars for one account, sized by days.
function segments(a) {
  const span = Math.max(1, (date(a.lastDate) - date(a.firstDate)) / 864e5);
  const pct = (from, to) => Math.max(1, ((date(to) - date(from)) / 864e5 / span) * 100);
  const out = [];
  let cursor = a.firstDate;
  for (const g of a.gaps) {
    out.push({ label: `${dayShort(cursor)} – ${dayShort(g.from)}`, percent: pct(cursor, g.from) });
    out.push({ label: `${g.days}d Gap`, percent: pct(g.from, g.to), gap: true });
    cursor = g.to;
  }
  out.push({ label: `${dayShort(cursor)} – ${dayShort(a.lastDate)}`, percent: pct(cursor, a.lastDate) });
  return out;
}

export function toStatements(s) {
  const lastUpload = s.files.map((f) => f.uploadedAt).sort().pop();
  const dupPaise = s.files.reduce((n, f) => n + f.duplicatePaise, 0);
  const m = s.merge;
  return {
    reconciliation: {
      lastRun: lastUpload ? `Updated ${ago(lastUpload)}` : '',
      cards: [
        { id: 'merged', label: 'Unified Volume', count: m.records, unit: 'records merged', amountText: `${plural(s.files.length, 'statement')} imported`, amountClass: 'text-secondary', detail: `Across ${plural(m.accounts, 'linked account')}`, link: { label: 'View reconciled list', to: '/transactions' } },
        { id: 'duplicates', label: 'Duplicate Cull', count: m.duplicatesSkipped, unit: 'exact duplicates pruned', amountText: `Saved ${formatCurrency(r(dupPaise))} double-count`, amountClass: 'text-tertiary font-medium', detail: 'Overlapping date window between statement batches', link: { label: 'View flags', to: '/flags' } },
        { id: 'transfers', label: 'Internal Transfers', count: m.transferPairs, unit: 'self-transfers excluded', amountText: `${formatCurrency(r(m.transferPaise))} neutral loop`, amountClass: 'text-secondary font-medium', detail: 'Moves between your own accounts are left out of income and spending', link: { label: 'View transfers', to: '/transactions' } },
      ],
    },
    coverage: {
      gapCount: s.coverage.gapCount,
      window: s.coverage.accounts.length ? `${day(s.coverage.accounts.map((a) => a.firstDate).sort()[0])} – ${day(s.coverage.accounts.map((a) => a.lastDate).sort().pop())}` : '',
      accounts: s.coverage.accounts.map((a) => {
        const days = Math.round((date(a.lastDate) - date(a.firstDate)) / 864e5) + 1;
        const gap = a.gaps[0];
        return {
          code: a.bank, name: `${a.bank} — ••${a.last4}`, last4: a.last4, start: day(a.firstDate), end: day(a.lastDate), segments: segments(a),
          status: gap ? `Gap detected: ${dayShort(gap.from)} – ${dayShort(gap.to)} (${gap.days} days)` : `100% continuous coverage (${days} days)`,
          gapNote: gap ? `Missing rows over ${gap.days} days` : '', txnCount: s.files.filter((f) => f.bank === a.bank && f.last4 === a.last4).reduce((n, f) => n + f.newRows, 0),
        };
      }),
    },
    files: s.files.map((f) => ({
      id: f.id, name: f.name || `Statement ${f.id}`, bank: f.bank.toLowerCase(), type: f.type || 'csv', meta: `${f.bank} ··${f.last4}`,
      uploadedAt: ago(f.uploadedAt), source: f.type === 'pdf' ? 'Manual upload' : 'CSV import', period: `${day(f.firstDate)} – ${day(f.lastDate)}`, records: f.rows, status: 'parsed',
    })),
    totalTransactions: m.records,
    institutions: m.accounts,
  };
}

// ---------- Transactions ----------

export const toTx = (t) => ({
  id: t.id, date: day(t.date), time: t.channel, initials: (t.merchant || '??').slice(0, 2).toUpperCase(), merchant: title(t.merchant || t.description),
  shortName: t.merchant || t.description, channel: t.channel, reference: t.reference || t.description, bank: t.bank, bankName: `${t.bank} Bank`, last4: t.last4,
  category: t.category || 'Other', categoryId: t.categoryId, amount: r(t.amountPaise), kind: t.kind,
  isoDate: t.date, cash: t.bank === 'Cash wallet', manual: t.source === 'manual', note: t.note,
});

export function toTransactions(list, categories, flagCount) {
  const rows = list.transactions.map(toTx);
  const s = list.summary;
  return {
    totalRecords: list.total,
    summary: {
      inflows: r(s.inflowPaise), outflows: r(s.outflowPaise), accounts: new Set(rows.map((t) => `${t.bank}${t.last4}`)).size,
      creditCount: rows.filter((t) => t.amount > 0).length, debitCount: rows.filter((t) => t.amount < 0).length, month: 'All time',
      retained: s.inflowPaise ? `${(((s.inflowPaise - s.outflowPaise) / s.inflowPaise) * 100).toFixed(1)}%` : '0%', unreviewedFlags: flagCount, duplicateSuspects: 0,
    },
    filters: { dateRange: rows.length ? `${rows[rows.length - 1].date} – ${rows[0].date}` : '' },
    transactions: rows,
    categoryOptions: categories.filter((c) => c.kind !== 'income').map((c) => ({ id: c.id, name: c.name, description: '', icon: catIcon(c.name) })),
  };
}

// ---------- Flags ----------

export function toFlags(f) {
  const base = (x) => ({ id: x.id, type: x.type, transactionId: x.transactionId, merchant: title(x.merchant), account: x.account, bankName: x.account.split(' ')[0], category: x.category, amount: r(x.amountPaise), source: `Statement: ${x.account}`, time: day(x.date) });
  const one = (x) => {
    if (x.type === 'duplicate') {
      const same = x.date === x.originalDate;
      return { ...base(x), orderRef: x.ref || 'none on statement', gapText: same ? 'on the same day' : 'a few days apart', originalTime: day(x.originalDate), duplicateTime: same ? `${day(x.date)} (same day)` : day(x.date) };
    }
    if (x.type === 'large') return { ...base(x), multiple: `${x.multiple}× your usual ${x.category} spend`, typicalAverage: r(x.usualPaise) };
    return { ...base(x), descriptor: title(x.merchant), recurringDay: '' };
  };
  const icon = { duplicate: 'warning', large: 'trending', 'new-merchant': 'store' };
  return {
    flags: f.flags.map(one),
    resolved: {
      count: f.resolved.length,
      items: f.resolved.map((x) => ({ id: x.id, icon: icon[x.type], merchant: title(x.merchant), resolution: x.decision === 'confirmed' ? 'Confirmed as a duplicate charge' : 'Reviewed as intentional', category: x.category, amount: r(x.amountPaise), date: dayShort(x.decidedAt.slice(0, 10)) })),
    },
  };
}

// ---------- Trends & Surplus ----------

const pctText = (p) => `${p > 0 ? '+' : ''}${p.toFixed(1)}%`;
const VARIANCE = {
  flat: (c) => ({ variance: `${pctText(c.changePct ?? 0)} Neutral`, varianceClass: 'text-secondary font-medium', sparkColor: '#495f82', iconClass: 'bg-surface-container text-primary' }),
  up: (c) => ({ variance: c.changePct == null ? 'New' : `↑ ${pctText(c.changePct)} Higher`, varianceClass: 'text-tertiary-container font-semibold', sparkColor: '#a73400', iconClass: 'bg-secondary-container/50 text-primary' }),
  down: (c) => ({ variance: `↓ ${pctText(c.changePct)} Lower`, varianceClass: 'text-primary font-semibold', sparkColor: '#0037b0', iconClass: 'bg-surface-container text-primary' }),
};

export function toTrends(t, plan, accounts) {
  const months = t.months;
  const last3 = months.slice(-3);
  const monthRow = (m) => ({
    label: `${monthShort(m.month)} '${m.month.slice(2, 4)}`, inflow: r(m.inflowPaise), outflow: r(m.outflowPaise), surplus: r(m.surplusPaise),
    ...(m.surplusPaise < 0 ? { note: `Deficit: -${formatCurrency(Math.abs(r(m.surplusPaise)))}` } : {}),
  });
  const avg = (rows) => rows.reduce((s, m) => s + m.surplusPaise, 0) / Math.max(1, rows.length);
  const prior = months.slice(-6, -3);
  const change = prior.length === 3 && avg(prior) !== 0 ? pctText(((avg(last3) - avg(prior)) / Math.abs(avg(prior))) * 100) : '—';
  const range = (rows) => `${monthShort(rows[0].month)} – ${monthShort(rows[rows.length - 1].month)} ${rows[rows.length - 1].month.slice(0, 4)}`;
  const positive = months.filter((m) => m.surplusPaise > 0).length;
  const cover = plan.insufficientHistory ? null : plan.emergencyFund;
  return {
    periods: [`Last ${months.length} Months: ${range(months)}`, `Last 3 Months: ${range(last3)}`],
    summary: {
      average: { amount: r(t.summary.averageSurplusPaise), change },
      best: { month: monthLabel(t.summary.best.month), amount: r(t.summary.best.surplusPaise), reason: t.summary.best.reason },
      toughest: { month: monthLabel(t.summary.toughest.month), amount: r(t.summary.toughest.surplusPaise), reason: t.summary.toughest.reason },
    },
    cashflow: {
      totalInflow: r(months.reduce((s, m) => s + m.inflowPaise, 0)), totalOutflow: r(months.reduce((s, m) => s + m.outflowPaise, 0)),
      netSurplus: r(months.reduce((s, m) => s + m.surplusPaise, 0)), months: months.map(monthRow),
    },
    categoryMonth: monthLabel(t.categoryMonth),
    categories: t.categories.slice(0, 8).map((c) => {
      const kind = c.direction === 'new' ? 'up' : c.direction;
      return { name: c.name, examples: c.merchants.map(title).join(', '), icon: catIcon(c.name), thisMonth: r(c.thisMonthPaise), median: r(c.medianPaise), direction: kind, sparkline: c.sparklinePaise.slice(-6).map(r), ...VARIANCE[kind](c) };
    }),
    findings: t.findings.map((text, i) =>
      i === 0
        ? { icon: 'info', iconClass: 'text-primary', title: text.replace(/\.$/, ''), body: [`${positive} of ${months.length} months ended with money left over.`], progress: { percent: (positive / months.length) * 100, label: `${positive}/${months.length} months` } }
        : { icon: 'info', iconClass: 'text-primary', title: text, body: [] },
    ),
    runway: cover
      ? { months: `${cover.monthsCovered ?? 0} Months`, detail: `Your cash covers ${formatCurrency(r(cover.monthlyEssentialsPaise))} a month of essentials (rent, EMI, bills, groceries, travel) for that long.` }
      : { months: '—', detail: 'Needs more statement history.' },
    ownAccounts: accounts,
  };
}

// ---------- Money Flow ----------

const FIXED = ['Rent', 'EMI'];
export function toMoneyFlow(f, compare) {
  const colorOf = { 0: '#0d9488', 1: '#1d4ed8', 3: '#06b6d4' };
  const cats = f.nodes.filter((n) => n.column === 2);
  const nodes = f.nodes.map((n, i) => ({ id: n.id, column: n.column, name: n.column === 1 ? n.name : title(n.name), amount: r(n.amountPaise), color: colorOf[n.column] || PALETTE[i % PALETTE.length] }));
  const links = f.links.map((l) => ({ from: l.from, to: l.to, value: r(l.valuePaise) }));
  // Money an account took in but did not send on is shown as a "Saved" flow, so every account balances.
  let saved = 0;
  for (const a of f.nodes.filter((n) => n.column === 1)) {
    const left = f.links.filter((l) => l.to === a.id).reduce((s, l) => s + l.valuePaise, 0) - f.links.filter((l) => l.from === a.id).reduce((s, l) => s + l.valuePaise, 0);
    if (left > 0) {
      links.push({ from: a.id, to: 'surplus', value: r(left) });
      saved += left;
    }
  }
  if (saved > 0) nodes.push({ id: 'surplus', column: 2, name: 'Saved / Surplus', amount: r(saved), color: '#059669' });

  const income = f.incomePaise || 1;
  const fixed = cats.filter((c) => FIXED.includes(c.name)).reduce((s, c) => s + c.amountPaise, 0);
  const pct = (p) => `${((p * 100) / income).toFixed(1)}%`;
  const d = f.selectedCategory;
  const variableTotal = f.spendPaise - fixed;
  const prev = prevMonth(f.month);
  const small = (p) => (p >= 100000 ? `${(p / 100000).toFixed(1)}k` : `${p}`);
  const selectedCategory = d && {
    name: d.name, shortName: d.name.split(' ')[0], connected: d.connectedAccounts.map((a) => `${a.account} (${a.sharePct}%)`).join(', '), amount: r(d.amountPaise),
    change: d.insufficientHistory || d.changePct == null ? 'Not enough history to compare' : `${pctText(d.changePct)} vs ${compare === 'prev' ? 'last month' : '3-mo med'}`,
    share: `${variableTotal ? Math.round((d.amountPaise * 100) / variableTotal) : 0}% of non-fixed monthly spend`,
    median: r(d.baselinePaise ?? 0), transactionCount: d.transactionCount, compareLabel: compare === 'prev' ? `${monthShort(f.month)} vs ${monthShort(prev)}` : `${monthShort(f.month)} vs 3-mo avg`,
    drivers: d.drivers.map((x) => ({ name: title(x.merchant), delta: r(x.deltaPaise), amountClass: x.deltaPaise > 0 ? 'text-error font-bold' : 'text-primary font-bold', tag: `${x.contributionPct}% of ${x.deltaPaise > 0 ? 'increase' : 'decrease'}`, tagClass: 'bg-amber-200 text-amber-900 font-bold', detail: `${plural(x.transactions, 'transaction')} in ${monthLabel(f.month)}.` })),
    concentration: { summary: `Top 3 = ${d.concentration.top3SharePct}%`, parts: d.concentration.parts.map((p) => ({ name: title(p.merchant), percent: p.sharePct })), tip: d.concentration.tip || 'Spending is spread across several merchants.' },
    trajectory: { range: `Range: ₹${small(Math.min(...d.trajectory.map((t) => t.amountPaise)) / 100)} - ₹${small(Math.max(...d.trajectory.map((t) => t.amountPaise)) / 100)}`, months: d.trajectory.map((t) => ({ month: monthShort(t.month), value: r(t.amountPaise), label: small(r(t.amountPaise)) })) },
  };
  const flexible = cats.filter((c) => !FIXED.includes(c.name)).sort((a, b) => b.amountPaise - a.amountPaise)[0];
  const merchant = f.nodes.filter((n) => n.column === 3).sort((a, b) => b.amountPaise - a.amountPaise)[0];
  const card = (label, badge, icon, cls, name, amountPaise, note, detail, query) => ({ label, badge, badgeIcon: icon, badgeClass: cls, title: title(name), amount: r(amountPaise), amountNote: note, detail, footer: `${monthLabel(f.month)}`, action: 'See transactions →', query });
  const insights = [
    flexible && card('Biggest Flexible Spend', `${Math.round((flexible.amountPaise * 100) / Math.max(1, variableTotal))}% of non-fixed`, 'pie', 'bg-cyan-100 text-cyan-900', flexible.name, flexible.amountPaise, `of ${formatCurrency(r(variableTotal))} non-fixed spend`, 'The largest category after rent and EMI.', flexible.name),
    merchant && card('Top Merchant', `${Math.round((merchant.amountPaise * 100) / Math.max(1, f.spendPaise))}% of spend`, 'trending', 'bg-rose-100 text-rose-800', merchant.name, merchant.amountPaise, `of ${formatCurrency(r(f.spendPaise))} total spend`, `The single merchant you paid most in ${monthLabel(f.month)}.`, merchant.name),
    card('Income Retained', pct(f.incomePaise - f.spendPaise), 'trending', 'bg-emerald-100 text-emerald-900', 'Money kept', Math.max(0, f.incomePaise - f.spendPaise), `of ${formatCurrency(r(f.incomePaise))} income`, 'Income minus all spending, with transfers between your own accounts left out.', ''),
  ].filter(Boolean);
  return {
    monthLabel: monthLabel(f.month), months: f.months, nodes, links, selectedCategory, insights,
    split: { retained: pct(Math.max(0, f.incomePaise - f.spendPaise)), fixed: pct(fixed), variable: pct(variableTotal) },
  };
}

// ---------- Ask ----------

const VERDICT_TONE = { yes: 'safe', risky: 'caution', stretch: 'caution', no: 'risk' };
const VERDICT_STATUS = { yes: 'Approved • Safe', risky: 'Conditional Approval • Cautionary', stretch: 'Stretch • Best case only', no: 'Not affordable' };
const CASE_NAMES = ['worst', 'typical', 'best'];

// Checks shown under the answer: the ones that failed are listed with what to do about it.
export function toSafeguards(missing) {
  return missing.map((m) => ({ status: 'fail', title: { HISTORY: 'Not enough history', INCOME: 'No income found', BALANCE: 'Balance unknown', GAP: 'Missing statement rows' }[m.code], detail: m.message }));
}

// What the "Can I afford...?" boxes suggest, sized to the user's own surplus.
export { suggestions };

// answer: POST /api/ask result; recurring: /api/recurring items; includeBonus: show the answer as if the one-off repeated.
export function toAsk(answer, recurring, includeBonus) {
  const bonus = answer.bonusScenario;
  const use = includeBonus && bonus ? bonus : answer;
  const cases = CASE_NAMES.map((n) => answer.cases[n]);
  const extra = includeBonus && bonus ? bonus.oneOff.paise : 0;
  const left = CASE_NAMES.map((n) => (includeBonus && bonus ? bonus.cases[n].leftAfterPurchasePaise : answer.cases[n].leftAfterPurchasePaise));
  const price = answer.pricePaise;
  const n = answer.months.length;
  const code = use.verdict.code;
  const typical = answer.cases.typical;
  const spread = typical.incomePaise ? Math.round(((answer.cases.best.incomePaise - answer.cases.worst.incomePaise) / typical.incomePaise) * 100) : 0;
  const subs = recurring.filter((x) => x.label === 'subscription');
  const monthlySurplus = (typical.incomePaise - typical.committedPaise - typical.variablePaise) / n;
  const subsSaved = subs.reduce((s, x) => s + -x.typicalPaise, 0);
  const upLeft = monthlySurplus - price, optLeft = monthlySurplus + subsSaved - price / 3;
  const row = (id, kind, title_, detail, values, tag) => ({ id, kind, title: title_, detail, values: values.map(r), ...(tag ? { tag } : {}) });
  return {
    verdict: {
      tone: VERDICT_TONE[code], status: VERDICT_STATUS[code], rule: 'Rule: worst-case income, high spending and a one-month buffer',
      headline: use.verdict.text,
      summary: `After the purchase you would have ${formatCurrency(r(left[0]))} in the worst case, ${formatCurrency(r(left[1]))} typically and ${formatCurrency(r(left[2]))} in the best case.`,
      confidence: { label: answer.confidence.label, segments: { High: 3, Medium: 2, Low: 1 }[answer.confidence.label], incomeVariance: `${spread}%`, note: answer.confidence.reason },
      metrics: [
        { label: 'Purchase Amount', value: formatCurrency(r(price)), valueClass: 'text-on-surface', note: 'One-time debit', noteClass: 'text-secondary' },
        { label: 'Target Horizon', value: `${monthShort(answer.targetMonth)} ${answer.targetMonth.slice(0, 4)}`, valueClass: 'text-on-surface', note: `Cash at the end of ${monthLabel(answer.targetMonth)}`, noteClass: 'text-secondary' },
        { label: 'Typical Money Left', value: formatCurrency(r(left[1]), { sign: true }), valueClass: left[1] < 0 ? 'text-error' : 'text-primary', note: 'After buffer and purchase', noteClass: 'text-secondary' },
        { label: 'Worst Case Left', value: formatCurrency(r(left[0]), { sign: true }), valueClass: left[0] < 0 ? 'text-error' : 'text-primary', note: left[0] < 0 ? 'Buffer would be breached' : 'Buffer stays intact', noteClass: left[0] < 0 ? 'text-error' : 'text-secondary' },
      ],
    },
    waterfall: {
      period: monthLabel(answer.targetMonth), scenarios: ['(low income, high spending)', '(median baseline)', '(high income, low spending)'],
      rows: [
        row('balance', 'balance', 'Current cash', 'Latest balance across your accounts', cases.map((c) => c.startingCashPaise)),
        row('income', 'income', 'Expected income', `${plural(n, 'month')} of income: 10th percentile, median, 90th percentile${extra ? ' + the one-off repeated once' : ''}`, cases.map((c) => c.incomePaise + extra)),
        row('committed', 'expense', 'Committed payments', answer.committed.map((c) => title(c.merchant)).join(', ') || 'None found', cases.map((c) => -c.committedPaise), 'Recurring'),
        row('variable', 'expense', 'Everyday spending', 'Per-category median of the last 3 months (75th percentile worst case, 25th best)', cases.map((c) => -c.variablePaise)),
        row('buffer', 'buffer', 'Safety buffer', 'One month of committed payments, kept untouched', cases.map((c) => -c.bufferPaise), 'Reserved'),
        row('purchase', 'purchase', 'This purchase', 'One-time deduction', cases.map(() => -price), 'Evaluated'),
      ],
      result: left.map((v) => ({ value: r(v), tone: v < 0 ? 'bad' : 'good', label: v < 0 ? 'Not covered' : 'Covered' })),
      bufferNote: 'The buffer is not savings to spend. It is ringfenced so your fixed commitments are still paid if income arrives late.',
    },
    bonus: bonus && { lastAmount: r(bonus.oneOff.paise), lastMonth: monthLabel(bonus.oneOff.date.slice(0, 7)), unlockedSurplus: r(bonus.oneOff.paise), simulationMessage: `Simulation active: the ${formatCurrency(r(bonus.oneOff.paise))} one-off income is added once to every scenario.` },
    whatIf: {
      baseSurplus: r(monthlySurplus),
      levers: subs.map((x) => ({ id: x.merchant, icon: 'tv', iconClass: 'bg-error-container/30 text-error', title: `Cancel ${title(x.merchant)}`, detail: `Charged about every ${x.cadenceDays} days`, impact: `+${formatCurrency(r(-x.typicalPaise))}/mo`, impactClass: 'text-emerald-800', saving: r(-x.typicalPaise) })),
      upfront: { outflow: -r(price), subscriptions: -r(subsSaved), buffer: r(typical.bufferPaise) },
      optimized: { subsSaved: r(subsSaved), emiOutflow: -Math.round(r(price) / 3), improvement: upLeft < 0 ? `${Math.round(((optLeft - upLeft) / Math.abs(upLeft)) * 100)}% better` : 'about the same' },
    },
    safeguards: [
      { status: 'warn', title: 'Estimates, not promises', detail: 'Built from your past statements only. Anything unusual in the future is not in these numbers.' },
    ],
  };
}

// ---------- Goals ----------

const GOAL_STATUS = { funded: 'onTrack', on_track: 'onTrack', tight: 'tight', off_track: 'unreachable', overdue: 'unreachable', unknown: 'tight' };
export const GOAL_CLASSES = ['Work & Equipment', 'Travel', 'Home', 'Education', 'Health', 'Other'];

// Last day of the month that is `months` after the latest statement's month: the target date sent to the server.
export function goalDate(asOf, months) {
  const d = date(`${asOf.slice(0, 7)}-01`);
  return new Date(d.getFullYear(), d.getMonth() + months + 1, 0).toLocaleDateString('en-CA');
}

export function toGoals(g, plan) {
  const avg = r(plan.surplus.typicalPaise);
  const s = g.summary;
  return {
    asOf: g.asOf,
    surplus: { average: avg, floor: r(plan.surplus.lowPaise) },
    summary: {
      portfolio: { count: s.count, fundedPercent: s.fundedPercent, saved: r(s.savedPaise), target: r(s.targetPaise) },
      commitment: { required: r(s.monthlyRequiredPaise), medianSurplus: s.typicalSurplusPaise == null ? avg : r(s.typicalSurplusPaise), shortfall: r(s.shortfallPaise ?? 0), spare: r(s.sparePaise ?? 0), allOnTrack: s.allOnTrack },
      viability: { solvent: s.onTrack, total: s.count, bufferStatus: `${plan.emergencyFund.monthsCovered ?? 0} months of essentials in cash`, emergencyFloor: r(plan.emergencyFund.targetPaise) },
    },
    goals: g.goals.map((x) => ({
      id: x.id, name: x.name, category: x.category || 'Other', priority: x.priority || 'Medium', status: GOAL_STATUS[x.status], statusLabel: x.statusText,
      target: r(x.targetPaise), saved: r(x.savedPaise), percentFunded: x.percentFunded.toFixed(1), monthlyNeeded: r(x.monthlyNeededPaise),
      horizon: `${monthLabel(x.targetDate.slice(0, 7))} (${plural(x.monthsLeft, 'month')} remaining)`, monthsLeft: x.monthsLeft, analysisIcon: 'chart',
      analysis: x.remainingPaise
        ? [`${x.statusText} You need ${formatCurrency(r(x.monthlyNeededPaise))} a month; your typical monthly surplus is ${formatCurrency(avg)}.`]
        : [x.statusText],
      actionLabel: GOAL_STATUS[x.status] === 'unreachable' ? 'Adjust Timeline' : 'Edit Goal',
    })),
    revisionId: `As of ${day(g.asOf)}`,
    classifications: GOAL_CLASSES,
    draft: { name: '', target: '', classification: GOAL_CLASSES[0], horizon: '', seed: '0', preview: {} },
  };
}

// ---------- Surplus Plan ----------

export function toSurplusPlan(p) {
  const f = p.emergencyFund;
  const asOf = date(p.asOf);
  const fiscalStart = asOf.getMonth() >= 3 ? asOf.getFullYear() : asOf.getFullYear() - 1; // Indian financial year starts in April
  const months = p.eta.slowestMonths;
  const done = new Date(asOf.getFullYear(), asOf.getMonth() + (months ?? 0), 1);
  return {
    fiscalYear: `FY ${fiscalStart}-${String(fiscalStart + 1).slice(2)}`,
    frameworkMode: p.framework,
    disclaimer: p.disclaimer,
    emergencyFund: {
      target: r(f.targetPaise), bufferMonths: f.bufferMonths, saved: r(f.savedPaise), runway: `${f.monthsCovered ?? 0} Months`, monthlyBaseline: r(f.monthlyEssentialsPaise),
      essentials: f.essentials.map((e) => ({ name: e.name, amount: r(e.monthlyPaise) })),
      milestones: [0, 25, 50, 75, 100].map((pc) => ({ amount: r((f.targetPaise * pc) / 100), label: pc === 0 ? 'Start' : `${pc}%` })),
      averageSurplus: r(p.surplus.typicalPaise),
      etaRange: f.funded ? 'Fully funded' : p.eta.fastestMonths == null ? 'Not reachable at the current surplus' : `${p.eta.fastestMonths} to ${months} months`,
      completion: f.funded ? 'Done' : months == null ? '—' : done.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    },
    options: p.options.map((o) => ({ icon: 'bank', badge: o.risk.split(':')[0], badgeIcon: 'shield', badgeClass: 'bg-secondary-fixed text-on-secondary-fix', title: o.title, description: o.bestFor, lockIn: o.lockIn, bestFor: o.bestFor, footerLabel: 'Risk', footerValue: o.risk })),
    allocation: {
      monthlySurplus: r(p.surplus.typicalPaise), remainingEmergency: r(f.shortfallPaise), targetLabel: formatCurrency(r(f.targetPaise)), defaultSplit: p.allocation.splitPct,
      presets: p.allocation.presets.map((x) => ({ split: x.splitPct, label: x.splitPct === 100 ? '100% Emergency Floor' : `${x.splitPct}% Emergency / ${100 - x.splitPct}% Goals` })),
    },
  };
}

// ---------- Track Record ----------

const short = (hash) => `${hash.slice(0, 6)}…${hash.slice(-4)}`;

export function toTrackRecord(tr, log, verify, accuracy) {
  const m = tr.months, s = tr.summary;
  const hits = m.filter((x) => x.hit).length;
  const entries = log.filter((e) => e.kind === 'forecast').map((f) => ({ f, a: log.find((e) => e.kind === 'actual' && e.target_month === f.target_month) })).filter((x) => x.a);
  const ledgerRow = ({ f, a }) => {
    const hit = a.actual_paise >= f.worst_paise && a.actual_paise <= f.best_paise;
    return { timestamp: day(f.made_on), question: `Surplus forecast for ${monthLabel(f.target_month)}`, verdict: hit ? 'In range' : a.actual_paise > f.best_paise ? 'Above range' : 'Below range', verdictType: hit ? 'safe' : a.actual_paise >= f.worst_paise ? 'conditional' : 'risk', projected: r(f.typical_paise), actual: r(a.actual_paise), actualClass: hit ? 'text-primary font-semibold' : 'text-tertiary font-semibold', hash: short(f.entry_hash) };
  };
  const rows = entries.map(ledgerRow).reverse();
  const peak = Math.max(1, ...m.map((x) => Math.max(x.bestPaise, x.actualPaise, 0)));
  const L = tr.learning;
  const labelled = accuracy.labelled > 0;
  const good = 'bg-surface-container text-primary';
  return {
    version: 'hash-chained log',
    integrity: { block: String(log.length), entries: log.length, valid: verify.valid, firstBroken: verify.firstBrokenLink, headHash: verify.headHash || '' },
    kpis: [
      { label: 'Forecast Accuracy', icon: 'target', value: `${Math.round(s.hitRate * 100)}%`, valueClass: 'text-on-surface', chip: `${hits} of ${m.length} in range`, chipClass: good, note: 'Actual surplus landed between the worst and best case' },
      { label: 'Average Miss', icon: 'down', value: formatCurrency(r(s.averageMissPaise)), valueClass: 'text-on-surface', chip: 'vs typical case', chipClass: good, note: 'Average distance from the typical forecast' },
      { label: 'Bias', icon: 'brain', value: formatCurrency(r(s.biasPaise), { sign: true }), valueClass: s.biasPaise < 0 ? 'text-error' : 'text-on-surface', chip: s.biasPaise < 0 ? 'Too optimistic' : 'Too cautious', chipClass: good, note: 'Negative means reality came in lower than forecast' },
      { label: 'Worst Case Held', icon: 'link', value: `${Math.round(s.worstCaseHeldRate * 100)}%`, valueClass: 'text-on-surface', chip: `${m.filter((x) => x.worstCaseHeld).length} of ${m.length}`, chipClass: good, note: 'Months that were no worse than the worst case' },
    ],
    finding: {
      headline: `Of our last ${m.length} forecasts, ${hits} landed inside the range.`,
      detail: tr.enoughToJudge ? 'Each month was forecast using only the months before it, then compared with what really happened.' : 'Fewer than 3 months have been judged, so treat these percentages as a first look, not a verdict.',
      facts: [
        { label: 'Log status', value: verify.valid ? 'Intact' : 'Broken', valueClass: verify.valid ? 'text-primary' : 'text-error', note: `${log.length} entries in the hash chain` },
        { label: 'Method', value: 'Earlier data only', valueClass: 'text-on-surface', note: 'No month sees its own future' },
      ],
    },
    scaleMax: Math.ceil(peak / 10000) * 100,
    forecasts: m.map((x) => ({
      month: monthLabel(x.month), query: x.source === 'backtest' ? 'Backtest: forecast from earlier data only' : 'Live forecast',
      low: Math.max(0, r(x.worstPaise)), high: Math.max(0, r(x.bestPaise)), actual: Math.max(0, r(x.actualPaise)),
      outcome: x.hit ? 'Within range' : `Out of range: actual ${formatCurrency(r(x.actualPaise))}`,
      note: `Forecast ${formatCurrency(r(x.worstPaise))} to ${formatCurrency(r(x.bestPaise))}, typical ${formatCurrency(r(x.typicalPaise))}; actual ${formatCurrency(r(x.actualPaise))}.`,
    })),
    ledger: { total: log.length, entries: rows.slice(0, 5), older: rows.slice(5) },
    learning: {
      baseline: labelled ? accuracy.before.accuracy * 100 : null, tuned: labelled ? accuracy.after.accuracy * 100 : null,
      note: labelled
        ? `Measured on the demo statements' true labels: ${accuracy.correctionsNeeded} merchant corrections lift categorisation accuracy.`
        : `You have made ${L.corrections} correction${L.corrections === 1 ? '' : 's'}; ${L.merchantsRemembered} merchant${L.merchantsRemembered === 1 ? ' is' : 's are'} now remembered for future uploads.`,
      corrections: L.corrections, merchantsRemembered: L.merchantsRemembered, rowsRecategorised: L.rowsRecategorised,
      overrides: labelled ? accuracy.steps.slice(0, 3).map((st) => ({ icon: 'basket', merchant: title(st.merchant), rule: `Corrected to ${st.correctedTo}`, status: `${st.rowsFixed} rows fixed` })) : [],
    },
  };
}
