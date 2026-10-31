// "Money in vs money out — last 6 months": rounded bars with the amount saved above each month; months that
// include a one-off bonus are marked. One line underneath with the average share of income saved.
import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactMoney, exact } from '../../utils/money';
import { useReducedMotion } from '../../hooks/useMotion';

// Month tick, plus "includes bonus" under months with one-off income.
function MonthTick({ x, y, payload, months }) {
  const m = months.find((d) => d.month === payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={14} textAnchor="middle" fill="#475569" fontSize={12}>{payload.value}</text>
      {m?.bonus && <text dy={28} textAnchor="middle" fill="#b45309" fontSize={10}>includes bonus</text>}
    </g>
  );
}

// Saved amount above each month, placed on an invisible line at the top of the taller bar so nothing covers it.
function SavedLabel({ x, y, index, months }) {
  const saved = months[index].saved;
  return (
    <text x={x} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill={saved < 0 ? '#b91c1c' : '#047857'}>
      {saved < 0 ? `−${compactMoney(-saved)}` : `+${compactMoney(saved)}`}
    </text>
  );
}

export default function MonthlyTrend({ trend }) {
  const reduced = useReducedMotion();
  const anyBonus = trend.months.some((m) => m.bonus);
  return (
    <section className="home-card home-in p-5 sm:p-6" style={{ '--delay': '600ms' }} aria-labelledby="trend">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="trend" className="text-[18px] font-semibold text-[#0b2545]">Money in vs money out — last 6 months</h2>
        <div className="flex items-center gap-3 text-[12px] text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#1d4ed8]" aria-hidden="true" /> In</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300" aria-hidden="true" /> Out</span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">+₹ saved</span>
        </div>
      </div>
      <div className="mt-4 h-[260px]" role="img" aria-label={`Money in and out for the last 6 months; you saved ${trend.savedPct}% of your income on average`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trend.months.map((m) => ({ ...m, top: Math.max(m.in, m.out) }))} barGap={4} barCategoryGap="28%" margin={{ top: 24, right: 8, bottom: anyBonus ? 16 : 0, left: 0 }}>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} interval={0} tick={<MonthTick months={trend.months} />} />
            <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} width={52} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip formatter={(v) => exact(v)} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="in" name="Money in" fill="#1d4ed8" radius={[6, 6, 0, 0]} isAnimationActive={!reduced} animationDuration={700} />
            <Bar dataKey="out" name="Money out" fill="#cbd5e1" radius={[6, 6, 0, 0]} isAnimationActive={!reduced} animationDuration={700} />
            <Line dataKey="top" stroke="none" dot={false} activeDot={false} legendType="none" tooltipType="none" isAnimationActive={false}>
              <LabelList content={<SavedLabel months={trend.months} />} />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[14px] text-slate-700">You saved <strong>{trend.savedPct}%</strong> of your income on average.</p>
    </section>
  );
}
