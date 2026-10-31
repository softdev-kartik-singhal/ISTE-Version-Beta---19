// Phone screen for the Plan section: two progress rings fill, and one product-type suggestion. Sample data.
import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';

const GOALS = [
  { name: 'Emergency fund', pct: 72 },
  { name: 'New phone', pct: 40 },
];

function Ring({ pct, filled }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#1d4ed8" strokeWidth="7" strokeLinecap="round"
        className="ring-fill" strokeDasharray={c} strokeDashoffset={filled ? c * (1 - pct / 100) : c} />
    </svg>
  );
}

export default function PlanScreen() {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFilled(true), 120); // let the ring paint empty first so it can animate
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-col gap-3 text-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Plan</p>
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map((g) => (
          <div key={g.name} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-2.5 flex flex-col items-center gap-1">
            <div className="relative">
              <Ring pct={g.pct} filled={filled} />
              <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold">{g.pct}%</span>
            </div>
            <span className="text-[11px] text-slate-600 text-center">{g.name}</span>
          </div>
        ))}
      </div>
      <div className="pop-in rounded-2xl bg-white border border-slate-200 shadow-sm p-3 flex gap-2" style={{ '--delay': '600ms' }}>
        <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold">Recurring deposit for your emergency fund</p>
          <p className="text-[11px] text-slate-600">A product type to look at, not a specific product.</p>
        </div>
      </div>
    </div>
  );
}
