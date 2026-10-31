// Friendly money for display: rounded to a sensible step (₹14,800 not ₹14,812.40) or shortened (₹9k, ₹7.3L).
// The exact figure stays available through formatCurrency (shown in tooltips).
import { formatCurrency } from './formatCurrency';

// Under ₹1,000 → nearest ₹10; under ₹1 lakh → nearest ₹100; above → nearest ₹1,000.
export function roundMoney(amount) {
  const abs = Math.abs(amount);
  const step = abs < 1000 ? 10 : abs < 100000 ? 100 : 1000;
  return Math.round(amount / step) * step;
}

export const rounded = (amount, options) => formatCurrency(roundMoney(amount), options);
export const exact = (amount) => formatCurrency(amount, { decimals: 2 });

// ₹950, ₹9k, ₹7.3L, ₹1.2Cr
export function compactMoney(amount) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  if (abs >= 1000) return `${sign}₹${Math.round(abs / 1000)}k`;
  return `${sign}₹${Math.round(abs)}`;
}
