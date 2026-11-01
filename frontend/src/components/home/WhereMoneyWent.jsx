// "Where your money went": donut with the total in the centre and an icon legend. Tapping a slice or a legend row
// opens Transactions filtered to that category.
import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { iconFor } from '../../utils/icons';
import { exact, rounded } from '../../utils/money';
import { useReducedMotion } from '../../hooks/useMotion';

export default function WhereMoneyWent({ spending }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const open = (slice) => navigate('/transactions', { state: slice.all ? {} : { category: slice.name } });

  return (
    <section data-tour="spending-cards" className="home-card home-in p-5 sm:p-6 flex flex-col" style={{ '--delay': '480ms' }} aria-labelledby="where-went">
      <h2 id="where-went" className="text-[18px] font-semibold text-[#0b2545]">Where your money went in {spending.month}</h2>
      <div className="mt-4 grid sm:grid-cols-[200px_1fr] gap-6 items-center">
        <div className="relative w-[200px] h-[200px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={spending.slices} dataKey="value" nameKey="name" innerRadius={66} outerRadius={96} paddingAngle={2} stroke="none"
                isAnimationActive={!reduced} animationDuration={700} onClick={open} className="cursor-pointer">
                {spending.slices.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v) => exact(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-[22px] font-extrabold text-[#0b2545]" title={`Exact: ${exact(spending.total)}`}>{rounded(spending.total)}</span>
            <span className="text-[12px] text-slate-500">spent</span>
          </div>
        </div>
        <ul className="space-y-1">
          {spending.slices.map((s) => {
            const Icon = iconFor(s.icon);
            return (
              <li key={s.name}>
                <button type="button" onClick={() => open(s)} className="w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]">
                  <span className="flex items-center gap-2 text-[14px] text-slate-700 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} aria-hidden="true" />
                    <Icon size={16} className="text-slate-500 shrink-0" aria-hidden="true" />
                    <span className="truncate">{s.name}</span>
                  </span>
                  <span className="tabular text-[14px] font-semibold text-[#0b2545]" title={`Exact: ${exact(s.value)}`}>{rounded(s.value)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
