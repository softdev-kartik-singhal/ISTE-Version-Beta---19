// Turns the backend's responses (money in paise, ISO dates) into the shapes the screens were built for
// (money in rupees, display strings). Pure functions: no fetching here.
import { formatCurrency } from '../utils/formatCurrency';
import { titleCase } from '../utils/text';

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

// ---------- Shared ----------

// "+4.2%" (used by Money Flow).
const pctText = (p) => `${p > 0 ? '+' : ''}${p.toFixed(1)}%`;

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
// The answer itself is shaped in askView.js; this is only the "can't answer yet" explanation.

// Checks shown when the statements are too incomplete for an answer: what is missing, in plain words.
export function toSafeguards(missing) {
  return missing.map((m) => ({ status: 'fail', title: { HISTORY: 'Not enough history', INCOME: 'No income found', BALANCE: 'Balance unknown', GAP: 'Missing statement rows' }[m.code], detail: m.message }));
}

// What the "Can I afford...?" boxes suggest, sized to the user's own surplus.
export { suggestions };

// ---------- Goals ----------

// The server decides every status (see backend/app/services/goals.py); this only converts paise to rupees and tidies names.
const goalView = (v) => ({ total: r(v.totalNeedPaise), count: v.goalCount, low: r(v.lowPaise), usual: r(v.usualPaise), good: r(v.goodPaise), bucket: v.bucket, summary: v.summary });

export function toGoal(x) {
  return {
    id: x.id, rawName: x.name, name: titleCase(x.name), category: x.category || 'Other', priority: x.priority,
    target: r(x.targetPaise), saved: r(x.savedPaise), remaining: r(x.remainingPaise), percent: Math.min(100, x.percentFunded),
    targetDate: x.targetDate, monthsFromToday: x.monthsFromToday, monthsLeft: x.monthsLeft, monthlyNow: r(x.monthlyNowPaise),
    statusCode: x.statusCode, statusLine: x.statusLine, earliestMonth: x.earliestMonth,
  };
}

export function toGoals(g) {
  return {
    asOf: g.asOf,
    goals: g.goals.map(toGoal),
    view: goalView(g.view),
    nudges: g.nudges.map((n) => ({ kind: n.kind, text: n.text })),
    totals: { saved: r(g.summary.savedPaise), target: r(g.summary.targetPaise), percent: g.summary.fundedPercent },
  };
}

export function toGoalPreview(p) {
  return { monthly: r(p.monthlyNowPaise), months: p.monthsFromToday, statusCode: p.statusCode, statusLine: p.statusLine, view: goalView(p.view) };
}

// ---------- Surplus Plan ----------

export function toSurplusPlan(p) {
  const f = p.emergencyFund;
  const today = new Date();
  const fiscalStart = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1; // Indian financial year starts in April
  const months = p.eta.slowestMonths;
  const done = new Date(today.getFullYear(), today.getMonth() + (months ?? 0), 1); // counted from today, not from the last statement
  return {
    fiscalYear: `FY ${fiscalStart}-${String(fiscalStart + 1).slice(2)}`,
    asOf: day(p.asOf),
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
