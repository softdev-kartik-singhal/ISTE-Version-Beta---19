// Phone screen for "Features": greeting, money left counting up, the next payment, and category bars. Sample data.
import { CalendarClock } from 'lucide-react';
import { inr, useCountUp } from '../landingHooks';

const BARS = [
  { label: 'Food', pct: 78 },
  { label: 'Groceries', pct: 55 },
  { label: 'Travel', pct: 40 },
  { label: 'Bills', pct: 30 },
];

export default function HomeScreen() {
  const left = useCountUp(14800, true, 1000);
  return (
    <div className="flex flex-col gap-3 text-slate-900">
      <p className="text-[12px] text-slate-500">Good morning, Aditya</p>
      <div>
        <p className="text-[28px] font-bold leading-none tracking-tight">{inr(left)}</p>
        <p className="text-[12px] text-slate-600 mt-1">left this month</p>
      </div>
      <span className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium">
        <CalendarClock size={12} className="text-[#1d4ed8]" /> Rent ₹28,000 · Fri
      </span>
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-3">
        <p className="text-[11px] font-semibold text-slate-500 mb-2">Spending by category</p>
        <div className="flex items-end gap-3 h-24" role="img" aria-label="Sample bar chart of spending by category">
          {BARS.map((b, i) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="grow-up w-full rounded-md bg-gradient-to-t from-[#1d4ed8] to-[#60a5fa]" style={{ height: `${b.pct}%`, '--delay': `${200 + i * 120}ms` }} />
              <span className="text-[10px] text-slate-500">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
