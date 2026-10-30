// Estimates password strength as entropy bits (length × log2 of the character pool) and maps it to 0–4 segments.

export function passwordStrength(password) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
  const bits = pool ? Math.round(password.length * Math.log2(pool) * 0.8) : 0;

  if (bits >= 80) return { bits, segments: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-700' };
  if (bits >= 60) return { bits, segments: 3, label: 'Good', color: 'bg-emerald-500', text: 'text-emerald-700' };
  if (bits >= 40) return { bits, segments: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-700' };
  return { bits, segments: password ? 1 : 0, label: 'Weak', color: 'bg-error', text: 'text-error' };
}
