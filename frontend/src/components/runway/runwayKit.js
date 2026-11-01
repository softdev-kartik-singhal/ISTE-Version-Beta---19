// Shared helpers for the Surplus Plan "runway": month labels counted from TODAY, dates, and the icon for each essential.
import { Bus, CreditCard, Fuel, Home, Landmark, ShoppingBasket, Utensils, Zap, CircleDollarSign } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The label of the month `i` months from now: 0 -> this month. January also shows the year.
export function monthTile(i) {
  const d = new Date();
  const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
  return { name: MONTHS[m.getMonth()], year: m.getFullYear(), short: m.getMonth() === 0 ? `Jan ’${String(m.getFullYear()).slice(2)}` : MONTHS[m.getMonth()] };
}

// "Oct 2027": the date `months` from today (not from the last statement).
export function monthsFromToday(months) {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(months * 30.4375));
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const monthsText = (n) => (n >= 100 ? '100+' : n.toFixed(1));

// Essential spending categories -> an icon (anything unknown gets a coin).
const ICONS = [
  [/rent|home|housing/i, Home], [/emi|loan/i, Landmark], [/fuel|petrol/i, Fuel], [/grocer/i, ShoppingBasket], [/bill|utilit|electric/i, Zap],
  [/travel|commute|transport/i, Bus], [/food|dining/i, Utensils], [/card/i, CreditCard],
];
export const essentialIcon = (name) => (ICONS.find(([re]) => re.test(name)) || [null, CircleDollarSign])[1];
