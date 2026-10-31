// Shared bits for the Goals screen: the icon tiles, how a status looks (always icon + words, never colour alone),
// and small formatting helpers.
import { Bike, Car, CalendarX, CircleAlert, CircleCheck, Gift, GraduationCap, HeartPulse, House, Laptop, Plane, ShieldCheck, Smartphone, Target, TriangleAlert, Trophy } from 'lucide-react';

// category is what gets saved (it must be one of the server's goal types so Suggestions keep working).
export const TILES = [
  { key: 'phone', label: 'Phone', icon: Smartphone, category: 'Work & Equipment', name: 'Phone', tint: 'bg-sky-50 text-sky-700', words: /phone|mobile/i },
  { key: 'laptop', label: 'Laptop', icon: Laptop, category: 'Work & Equipment', name: 'Laptop', tint: 'bg-indigo-50 text-indigo-700', words: /laptop|macbook|computer/i },
  { key: 'bike', label: 'Bike', icon: Bike, category: 'Other', name: 'Bike', tint: 'bg-emerald-50 text-emerald-700', words: /bike|cycle|scooter|activa/i },
  { key: 'car', label: 'Car', icon: Car, category: 'Other', name: 'Car', tint: 'bg-slate-100 text-slate-700', words: /\bcar\b|suv|sedan/i },
  { key: 'trip', label: 'Trip', icon: Plane, category: 'Travel', name: 'Trip', tint: 'bg-cyan-50 text-cyan-700', words: /trip|travel|flight|vacation|holiday|tour/i },
  { key: 'home', label: 'Home', icon: House, category: 'Home', name: 'Home', tint: 'bg-amber-50 text-amber-700', words: /home|house|flat|rent deposit/i },
  { key: 'study', label: 'Study', icon: GraduationCap, category: 'Education', name: 'Course', tint: 'bg-violet-50 text-violet-700', words: /study|course|college|degree|school|fees|mba/i },
  { key: 'health', label: 'Health', icon: HeartPulse, category: 'Health', name: 'Health', tint: 'bg-rose-50 text-rose-700', words: /health|surgery|medical|treatment/i },
  { key: 'gift', label: 'Gift', icon: Gift, category: 'Other', name: 'Gift', tint: 'bg-pink-50 text-pink-700', words: /gift|wedding|birthday|anniversary/i },
  { key: 'emergency', label: 'Emergency fund', icon: ShieldCheck, category: 'Other', name: 'Emergency Fund', tint: 'bg-blue-50 text-blue-700', words: /emergency|safety/i },
  { key: 'other', label: 'Something else', icon: Target, category: 'Other', name: '', tint: 'bg-slate-100 text-slate-700', words: /$^/ },
];
const BY_KEY = Object.fromEntries(TILES.map((t) => [t.key, t]));
const BY_CATEGORY = { Travel: 'trip', Home: 'home', Education: 'study', Health: 'health', 'Work & Equipment': 'laptop' };

// The icon comes from the goal's name first ("bike" -> bike), then from its saved category.
export function tileFor(name, category) {
  return TILES.find((t) => t.words.test(name || '')) || BY_KEY[BY_CATEGORY[category]] || BY_KEY.other;
}
export const tileByKey = (key) => BY_KEY[key] || BY_KEY.other;

// How each status looks. `ring` colours the progress ring; `text` and `pill` are for light cards.
export const STATUS = {
  low_ok: { icon: CircleCheck, text: 'text-emerald-800', pill: 'bg-emerald-50 text-emerald-800', ring: '#059669' },
  usual_ok: { icon: CircleCheck, text: 'text-blue-800', pill: 'bg-blue-50 text-blue-800', ring: '#1d4ed8' },
  needs_more: { icon: TriangleAlert, text: 'text-amber-800', pill: 'bg-amber-50 text-amber-800', ring: '#d97706' },
  unreachable: { icon: CircleAlert, text: 'text-red-800', pill: 'bg-red-50 text-red-800', ring: '#dc2626' },
  overdue: { icon: CalendarX, text: 'text-red-800', pill: 'bg-red-50 text-red-800', ring: '#dc2626' },
  funded: { icon: Trophy, text: 'text-emerald-800', pill: 'bg-emerald-50 text-emerald-800', ring: '#059669' },
  none: { icon: Target, text: 'text-slate-700', pill: 'bg-slate-100 text-slate-700', ring: '#1d4ed8' },
};

export const MILESTONES = [25, 50, 75, 100];

const parts = (iso) => new Date(`${iso.slice(0, 10)}T00:00:00`);
export const monthYear = (iso) => parts(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
export const fullDate = (iso) => parts(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const inMonths = (n) => (n <= 0 ? 'date passed' : n === 1 ? 'in 1 month' : `in ${n} months`);

// 'YYYY-MM-DD' for today + n months (clamped to the month's last day), in local time.
export function datePlusMonths(n) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
  d.setDate(Math.min(now.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d.toLocaleDateString('en-CA');
}
export const todayIso = () => new Date().toLocaleDateString('en-CA');
export const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
};

// Indian digit grouping for an input: '150000' -> '1,50,000'.
export const groupDigits = (digits) => (digits ? new Intl.NumberFormat('en-IN').format(Number(digits)) : '');
export const onlyDigits = (text) => text.replace(/\D/g, '').slice(0, 10);
