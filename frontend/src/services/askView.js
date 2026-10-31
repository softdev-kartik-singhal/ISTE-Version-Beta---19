// Shapes the Ask answer for the screen. Pure functions, no fetching. Money arrives in paise and leaves in rupees.
// The numbers all come from the backend's answer (and /api/what-if, which runs the same calculation); this file
// only picks wording and lays the steps out.
import { monthLabel, monthShort, r, title } from './adapters';
import { shortRupees } from '../utils/money';

export const CASE_KEYS = ['worst', 'typical', 'best'];
export const CASE_LABEL = { worst: 'Bad month', typical: 'Usual month', best: 'Good month' };
export const CASE_HINT = { worst: 'income low, spending high', typical: 'income and spending as usual', best: 'income high, spending low' };

// Backend verdict codes -> the three states the badge shows.
const STATE_OF_CODE = { yes: 'yes', risky: 'typical', stretch: 'no', no: 'no' };
export const verdictState = (code) => STATE_OF_CODE[code] || 'no';

const date = (ym) => new Date(`${ym}-01T00:00:00`);
export function addMonths(ym, k) {
  const d = date(ym);
  d.setMonth(d.getMonth() + k);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// "October 2026 — the month after your latest statement" when that is what "next month" means.
export function monthNote(targetMonth, asOf) {
  const next = addMonths(asOf.slice(0, 7), 1);
  return targetMonth === next ? `${monthLabel(targetMonth)} — the month after your latest statement` : monthLabel(targetMonth);
}

// One line on why we are (or are not) sure: "Medium — your income changes a lot from month to month."
function confidenceOf(answer) {
  const c = answer.confidence;
  const reason = c.reason.replace(/the typical case/i, 'the usual case').replace(/\.$/, '');
  const lower = reason.charAt(0).toLowerCase() + reason.slice(1);
  return { label: c.label, segments: { High: 3, Medium: 2, Low: 1 }[c.label], line: `${c.label} — ${lower}.` };
}

// Headline, one sentence and the "what would change this" line, all from the numbers.
function wordsFor({ state, left, price, worstHeadroom, lowPerMonth, targetMonth }) {
  const short = (n) => shortRupees(Math.abs(n));
  let headline;
  let sentence;
  if (state === 'yes') {
    headline = 'Yes — you can afford it, even in a bad month.';
    sentence = `You'd still have about ${short(left.worst)} after bills, your safety cushion and this purchase.`;
  } else if (state === 'typical') {
    headline = 'Only if your income is normal.';
    sentence = `You'd have ${short(left.typical)} left in a usual month, but ${short(left.worst)} short in a bad one.`;
  } else {
    headline = `Not in ${monthLabel(targetMonth).split(' ')[0]} — it doesn't fit yet.`;
    sentence = left.typical < 0
      ? `You'd be about ${short(left.typical)} short even in a usual month.`
      : 'It only fits if you have a very good month.';
  }

  let change;
  if (state === 'yes') {
    change = `Anything up to ${shortRupees(worstHeadroom)} would still be a Yes.`;
  } else if (lowPerMonth > 0) {
    const wait = Math.max(1, Math.ceil((price - worstHeadroom) / lowPerMonth)); // bad-month savings needed to close the gap
    change = `Waiting until ${monthLabel(addMonths(targetMonth, wait))} makes it a Yes.`;
  } else if (worstHeadroom > 0) {
    change = `${shortRupees(worstHeadroom)} or less would be a Yes now.`;
  } else {
    change = 'Spending is above income in a bad month, so cutting regular costs comes first.';
  }
  return { headline, sentence, change };
}

// The steps from the starting balance to what is left, for one case.
function stepsFor(c, extra) {
  const income = c.incomePaise + extra;
  return [
    { id: 'start', short: 'Start', icon: 'wallet', sign: '', label: 'Your balance today', tip: 'Cash across your accounts on your newest statement.', value: r(c.startingCashPaise) },
    { id: 'income', short: 'Income', icon: 'in', sign: '+', label: 'Income coming in', tip: 'Income expected from now to the end of that month, from your past statements.', value: r(income) },
    { id: 'regular', short: 'Bills', icon: 'repeat', sign: '−', label: 'Regular payments', tip: 'Rent, EMIs and subscriptions that fall due before the end of that month.', value: r(c.committedPaise) },
    { id: 'everyday', short: 'Spending', icon: 'cart', sign: '−', label: 'Everyday spending', tip: 'What you usually spend on food, travel and shopping over those months.', value: r(c.variablePaise) },
    { id: 'cushion', short: 'Cushion', icon: 'shield', sign: '−', label: 'Safety cushion', tip: 'One month of your regular payments, kept aside so bills are paid even if income is late.', value: r(c.bufferPaise) },
    { id: 'purchase', short: 'Purchase', icon: 'bag', sign: '−', label: 'This purchase', tip: 'The price from your question.', value: r(c.pricePaise) },
  ];
}

// answer: POST /api/ask result. includeBonus: show the answer as if last year's one-off income repeated once.
export function toAskView(answer, includeBonus) {
  const bonus = answer.bonusScenario;
  const using = includeBonus && bonus;
  const extra = using ? bonus.oneOff.paise : 0;
  const n = answer.months.length;
  const price = r(answer.pricePaise);

  const cases = CASE_KEYS.map((key) => {
    const base = answer.cases[key];
    const final = using ? bonus.cases[key] : base;
    return {
      key,
      label: CASE_LABEL[key],
      hint: CASE_HINT[key],
      steps: stepsFor(base, extra),
      left: r(final.leftAfterPurchasePaise),
    };
  });
  const left = Object.fromEntries(cases.map((c) => [c.key, c.left]));
  const state = verdictState((using ? bonus : answer).verdict.code);

  const worst = answer.cases.worst;
  const worstHeadroom = r((using ? bonus.cases.worst : worst).headroomPaise);
  const lowPerMonth = r((worst.incomePaise - worst.committedPaise - worst.variablePaise) / n); // what a bad month adds each month

  return {
    state,
    price,
    targetMonth: answer.targetMonth,
    left,
    baseLeft: Object.fromEntries(CASE_KEYS.map((k) => [k, r(answer.cases[k].leftAfterPurchasePaise)])), // the answer without the bonus
    cases,
    confidence: confidenceOf(answer),
    ...wordsFor({ state, left, price, worstHeadroom, lowPerMonth, targetMonth: answer.targetMonth }),
    bonus: bonus && { amount: r(bonus.oneOff.paise), monthShort: monthShort(bonus.oneOff.date.slice(0, 7)) },
  };
}

// POST /api/what-if result -> the same three "left" numbers before and after, and the difference.
export function toChangeView(res) {
  const before = Object.fromEntries(CASE_KEYS.map((k) => [k, r(res.original.cases[k].leftAfterPurchasePaise)]));
  const after = Object.fromEntries(CASE_KEYS.map((k) => [k, r(res.modified.cases[k].leftAfterPurchasePaise)]));
  const diff = after.typical - before.typical;
  return {
    before,
    after,
    diff,
    pct: before.typical ? (diff / Math.abs(before.typical)) * 100 : null,
    stateBefore: verdictState(res.original.verdict.code),
    stateAfter: verdictState(res.modified.verdict.code),
    changed: res.verdictChanged,
  };
}

// The regular payments the user can switch off (subscriptions), with their monthly cost in rupees.
export function toSubscriptions(recurring) {
  return recurring.filter((x) => x.label === 'subscription').map((x) => ({ merchant: x.merchant, name: title(x.merchant), monthly: r(-x.typicalPaise) }));
}
