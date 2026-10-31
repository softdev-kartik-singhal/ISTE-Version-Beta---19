// Goal timeline helpers. Months are counted from the latest statement's month, which api.js sets when goals load.

let baseMonth = new Date();

export function setGoalBase(iso) {
  baseMonth = new Date(`${iso.slice(0, 7)}-01T00:00:00`);
}

export function horizonLabel(monthsLeft) {
  const date = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + monthsLeft, 1);
  const month = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return `${month} (${monthsLeft} month${monthsLeft === 1 ? '' : 's'} remaining)`;
}

// Fewest months that keep the monthly amount within 75% of the average surplus.
export function realisticMonths(remaining, averageSurplus) {
  return Math.max(1, Math.ceil(remaining / (averageSurplus * 0.75)));
}
