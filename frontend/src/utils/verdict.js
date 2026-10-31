// The three affordability verdicts, plus the one-sentence answer and one suggestion worked out from the answer's own numbers.
import { rounded } from './money';

// Backend verdict codes → the three states VerdictBadge shows.
const STATE_OF_CODE = { yes: 'yes', risky: 'typical', stretch: 'no', no: 'no' };
export const verdictState = (code) => STATE_OF_CODE[code] || 'no';

const monthName = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
function addMonths(ym, k) {
  const d = new Date(`${ym}-01T00:00:00`);
  d.setMonth(d.getMonth() + k);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// All amounts in rupees. leftUsual / leftLow: cash left after bills, the safety buffer and the price, if income is normal / low.
// worstHeadroom: what is spare if income is low, before the price. lowPerMonth: what a low-income month adds.
export function answerLines({ state, price, leftUsual, leftLow, worstHeadroom, lowPerMonth, targetMonth }) {
  let sentence;
  if (state === 'yes') sentence = `You'd still have ${rounded(leftLow)} left after bills, even if income is low.`;
  else if (state === 'typical') sentence = `You'd have ${rounded(leftUsual)} left after bills if income is normal, but be ${rounded(-leftLow)} short if it's low.`;
  else if (leftUsual < 0) sentence = `You'd be ${rounded(-leftUsual)} short after bills.`;
  else sentence = 'This only works if income is higher than usual.';

  let suggestion;
  if (state === 'yes') suggestion = `Anything up to ${rounded(worstHeadroom)} is a Yes.`;
  else if (lowPerMonth > 0) {
    const extra = Math.ceil((price - worstHeadroom) / lowPerMonth); // low-income months of saving needed to close the gap
    suggestion = `Waiting until ${monthName(addMonths(targetMonth, extra))} makes it a Yes.`;
  } else if (worstHeadroom > 0) suggestion = `${rounded(worstHeadroom)} or less would be a Yes now.`;
  else suggestion = 'Cutting regular costs comes first: spending is above income in a low month.';

  return { sentence, suggestion };
}
