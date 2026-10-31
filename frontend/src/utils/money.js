// Friendly money for display: rounded (₹70,300 not ₹70,346) or short (₹9k, ₹7.3L). Exact values go in tooltips.
import { formatCurrency } from './formatCurrency';

// Under ₹1,000 → nearest ₹10; under ₹1 lakh → nearest ₹100; above → nearest ₹1,000.
export function roundMoney(amount) {
  const abs = Math.abs(amount);
  const step = abs < 1000 ? 10 : abs < 100000 ? 100 : 1000;
  return Math.round(amount / step) * step;
}

export const rounded = (amount, options) => formatCurrency(roundMoney(amount), options);
export const exact = (amount) => formatCurrency(amount);

// ₹950, ₹9k, ₹7.3L, ₹1.2Cr
export function compactMoney(amount) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  if (abs >= 1000) return `${sign}₹${Math.round(abs / 1000)}k`;
  return `${sign}₹${Math.round(abs)}`;
}

// ₹6.85L, ₹42.5k, ₹950: lakh and thousand short forms with up to 2 decimals (for the answer's headline numbers).
export function shortRupees(amount) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const trim = (n, d) => n.toFixed(d).replace(/\.?0+$/, '');
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7, 2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5, 2)}L`;
  if (abs >= 1e3) return `${sign}₹${trim(abs / 1e3, 1)}k`;
  return `${sign}₹${Math.round(abs)}`;
}
