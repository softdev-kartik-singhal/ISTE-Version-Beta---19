// Formats a number as Indian rupees with lakh grouping, e.g. 120000 -> "₹1,20,000".

export function formatCurrency(amount, { decimals = 0, sign = false } = {}) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));

  if (amount < 0) return '-' + formatted;
  if (sign && amount > 0) return '+' + formatted;
  return formatted;
}
