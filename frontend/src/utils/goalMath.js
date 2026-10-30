// Goal feasibility maths: monthly amount needed, status against average surplus, and a realistic timeline.
import { formatCurrency } from './formatCurrency';

// Goals count months from this point (one month left = March 2025).
const BASE_MONTH = new Date(2025, 1, 1);

export function horizonLabel(monthsLeft) {
  const date = new Date(BASE_MONTH.getFullYear(), BASE_MONTH.getMonth() + monthsLeft, 1);
  const month = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return `${month} (${monthsLeft} month${monthsLeft === 1 ? '' : 's'} remaining)`;
}

// Fewest months that keep the monthly amount within 75% of the average surplus.
export function realisticMonths(remaining, averageSurplus) {
  return Math.max(1, Math.ceil(remaining / (averageSurplus * 0.75)));
}

// Rebuilds the derived fields of a goal (needed per month, status, analysis text) from its inputs.
export function evaluateGoal(goal, averageSurplus) {
  const remaining = Math.max(0, goal.target - goal.saved);
  const monthlyNeeded = Math.round(remaining / goal.monthsLeft);
  const share = monthlyNeeded / averageSurplus;
  const percentFunded = ((goal.saved / goal.target) * 100).toFixed(1);

  let status;
  let analysis;
  let analysisIcon;
  if (share <= 0.5) {
    status = 'onTrack';
    analysisIcon = 'verified';
    analysis = [
      'Comfortably covered by ',
      { text: `${(share * 100).toFixed(1)}%`, className: 'font-semibold text-on-surface' },
      ' of your average monthly surplus without affecting emergency liquidity floor.',
    ];
  } else if (share <= 1) {
    status = 'tight';
    analysisIcon = 'chart';
    analysis = [
      `Uses ${(share * 100).toFixed(0)}% of your ${formatCurrency(averageSurplus)} average surplus, leaving `,
      { text: `${formatCurrency(averageSurplus - monthlyNeeded)}/mo`, className: 'font-semibold text-tertiary' },
      ' for everything else.',
    ];
  } else {
    status = 'unreachable';
    analysisIcon = 'siren';
    const months = realisticMonths(remaining, averageSurplus);
    analysis = [
      `Required ${formatCurrency(monthlyNeeded)}/mo exceeds total average liquid surplus (${formatCurrency(averageSurplus)}). Extending by ${months - goal.monthsLeft} months brings required allocation down to `,
      { text: `${formatCurrency(Math.round(remaining / months))}/mo`, className: 'font-semibold text-on-surface' },
      '.',
    ];
  }

  const statusLabel = { onTrack: 'On track', tight: 'Tight — little surplus left', unreachable: 'Unreachable at this date' }[status];
  return {
    ...goal,
    monthlyNeeded,
    percentFunded,
    status,
    statusLabel,
    analysis,
    analysisIcon,
    horizon: horizonLabel(goal.monthsLeft),
    actionLabel: status === 'unreachable' ? 'Adjust to Realistic Date' : 'Adjust Timeline',
  };
}
