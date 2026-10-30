// Mock affordability engine: turns a question like "Can I afford an ₹80,000 phone?" into a full Ask result.
// The FastAPI backend will replace this; the shape of the returned object is what the Ask page expects.
import { formatCurrency } from '../utils/formatCurrency';

const DEFAULT_AMOUNT = 80000;

// "₹1,20,000 MacBook Pro with 6-month EMI" -> { amount: 120000, item: 'MacBook Pro', emiMonths: 6 }
function parseQuestion(question) {
  const amountMatch = question.match(/₹\s?([\d,]+)/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : DEFAULT_AMOUNT;
  const itemMatch = question.match(/₹\s?[\d,]+\s+([A-Za-z0-9 ]+?)(?=\s+(?:next|in|with|for|EMI)\b|\?|$)/);
  const emiMatch = question.match(/(\d+)-month/i);
  return {
    amount,
    item: itemMatch ? itemMatch[1].trim() : 'Purchase',
    emiMonths: emiMatch ? Number(emiMatch[1]) : null,
  };
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function evaluateQuestion(base, question, { includeBonus = false } = {}) {
  const { amount, item, emiMonths } = parseQuestion(question);
  // An EMI question only hits this month's cashflow with one instalment.
  const deduction = emiMonths ? Math.round(amount / emiMonths) : amount;

  let rows = base.waterfall.rows.map((row) =>
    row.kind === 'purchase'
      ? {
          ...row,
          title: question === base.question ? row.title : `Purchase: ${capitalize(item)}`,
          detail: emiMonths ? `First of ${emiMonths} EMI instalments (${formatCurrency(deduction)}/month)` : row.detail,
          values: [-deduction, -deduction, -deduction],
        }
      : row,
  );
  if (includeBonus) {
    const bonusRow = {
      id: 'bonus',
      kind: 'income',
      title: 'Annual bonus (simulated)',
      detail: `Last year's HDFC payroll bonus of ${formatCurrency(base.bonus.lastAmount)} included`,
      values: [base.bonus.lastAmount, base.bonus.lastAmount, base.bonus.lastAmount],
    };
    rows = [...rows.slice(0, 2), bonusRow, ...rows.slice(2)];
  }

  // The design's results include adjustments not listed as rows, so we start from its results for the default
  // ₹80,000 question and shift them by how much this purchase (and any bonus) differs.
  const shift = DEFAULT_AMOUNT - deduction + (includeBonus ? base.bonus.lastAmount : 0);
  const [worst, typical, best] = base.waterfall.result.map((r) => r.value + shift);
  const result = [
    { value: worst, tone: worst < 0 ? 'bad' : 'good', label: worst < 0 ? 'Breaches Buffer' : 'Safe Cushion' },
    { value: typical, tone: typical < 0 ? 'bad' : 'good', label: typical < 0 ? 'Breaches Buffer' : 'Safe Cushion' },
    { value: best, tone: best < 0 ? 'bad' : 'good', label: best < 0 ? 'Breaches Buffer' : 'Comfort Margin' },
  ];

  const verdict = buildVerdict(base.verdict, { amount, deduction, worst, typical, emiMonths, includeBonus });

  const emiShock = Math.round(amount - amount / 3);
  const whatIf = {
    ...base.whatIf,
    baseSurplus: typical,
    levers: base.whatIf.levers.map((lever) =>
      lever.id === 'emi'
        ? {
            ...lever,
            title: `Convert ${formatCurrency(amount)} to 3-month No-Cost EMI`,
            detail: `HDFC Millennia offer • ${formatCurrency(Math.round(amount / 3))} / month`,
            impact: `-${formatCurrency(emiShock)} shock`,
            saving: emiShock,
          }
        : lever,
    ),
    upfront: { ...base.whatIf.upfront, outflow: -deduction },
    optimized: { ...base.whatIf.optimized, emiOutflow: -Math.round(amount / 3) },
  };

  return { ...base, question, includeBonus, verdict, waterfall: { ...base.waterfall, rows, result }, whatIf };
}

function buildVerdict(baseVerdict, { amount, deduction, worst, typical, emiMonths, includeBonus }) {
  const metrics = [
    { label: 'Purchase Amount', value: formatCurrency(amount), valueClass: 'text-on-surface', note: emiMonths ? `${emiMonths}-month EMI` : 'One-time debit', noteClass: 'text-secondary' },
    baseVerdict.metrics[1],
    {
      label: 'Typical Free Cashflow',
      value: formatCurrency(typical, { sign: true }),
      valueClass: typical < 0 ? 'text-error' : 'text-emerald-700',
      note: typical < 0 ? 'Buffer Loss' : 'Safe Cushion Retained',
      noteClass: typical < 0 ? 'text-error font-medium' : 'text-emerald-800 font-medium',
    },
    {
      label: 'Worst Case Balance',
      value: formatCurrency(worst, { sign: true }),
      valueClass: worst < 0 ? 'text-error' : 'text-emerald-700',
      note: worst < 0 ? 'Overdraft / Buffer Loss' : 'Buffer intact',
      noteClass: worst < 0 ? 'text-error font-medium' : 'text-emerald-800 font-medium',
    },
  ];
  const bonusNote = includeBonus ? ' (bonus included)' : '';

  if (worst >= 0) {
    return {
      ...baseVerdict,
      tone: 'safe',
      status: 'Approved • Safe',
      headline: 'Yes — you can afford this',
      summary: `Even in a dry freelance month, ${formatCurrency(deduction)} leaves your ₹35,000 safety buffer intact with ${formatCurrency(worst)} to spare${bonusNote}.`,
      confidence: { ...baseVerdict.confidence, label: 'High (88%)', segments: 3 },
      metrics,
    };
  }
  if (typical >= 0) {
    return {
      ...baseVerdict,
      tone: 'caution',
      summary: `Your monthly surplus can absorb the ${formatCurrency(deduction)} hit in regular cycles, but a dry freelance spell will breach your ₹35,000 safety threshold by ${formatCurrency(-worst)}${bonusNote}.`,
      metrics,
    };
  }
  return {
    ...baseVerdict,
    tone: 'risk',
    status: 'Not Recommended • High Risk',
    headline: 'Not this month — it would breach your safety buffer',
    summary: `Even with typical income, ${formatCurrency(deduction)} would eat ${formatCurrency(-typical)} into your ₹35,000 safety buffer${bonusNote}. Consider an EMI or waiting a cycle.`,
    confidence: { ...baseVerdict.confidence, label: 'Low (31%)', segments: 1 },
    metrics,
  };
}
