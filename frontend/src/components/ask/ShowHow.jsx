// "Show how we worked it out" (closed by default): the steps from today's balance to what is left, for one case at a
// time (bad / usual / good month). A mini waterfall chart sits beside the list on desktop; "Compare all three" shows the table.
import { useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown, CircleCheck, CircleX, Repeat, ShieldCheck, ShoppingBag, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import InfoTip from '../ui/InfoTip';
import { useReducedMotion } from '../../hooks/useMotion';
import { compactMoney, exact, rounded } from '../../utils/money';

const ICONS = { wallet: Wallet, in: TrendingUp, repeat: Repeat, cart: ShoppingCart, shield: ShieldCheck, bag: ShoppingBag };
const TOGGLE = 'px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]';

// Running totals as floating bars: start, then each step up or down, then the result.
function chartRows(c) {
  let total = 0;
  const rows = c.steps.map((s) => {
    const from = total;
    total = s.id === 'start' ? s.value : s.sign === '+' ? total + s.value : total - s.value;
    return { name: s.short, range: [Math.min(from, total), Math.max(from, total)], kind: s.id === 'start' ? 'start' : s.sign === '+' ? 'up' : 'down', amount: s.value };
  });
  rows.push({ name: 'Left', range: [Math.min(0, c.left), Math.max(0, c.left)], kind: c.left < 0 ? 'short' : 'left', amount: c.left });
  return rows;
}
const BAR_COLOR = { start: '#94a3b8', up: '#10b981', down: '#f59e0b', left: '#1d4ed8', short: '#dc2626' };

function Steps({ c }) {
  return (
    <ol className="space-y-1.5" key={c.key}>
      {c.steps.map((s, i) => {
        const Icon = ICONS[s.icon];
        return (
          <li key={s.id} className="ask-step flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5" style={{ '--delay': `${i * 70}ms` }}>
            <span className="flex items-center gap-2.5 text-[14px] text-slate-700 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-white text-[#1d4ed8] flex items-center justify-center shadow-sm shrink-0"><Icon size={16} aria-hidden="true" /></span>
              <span className="truncate">{s.label}</span>
              <InfoTip text={s.tip} />
            </span>
            <span className={`tabular text-[15px] font-semibold ${s.sign === '+' ? 'text-emerald-700' : 'text-[#0b2545]'}`} title={`Exact: ${exact(s.value)}`}>
              {s.sign} {rounded(s.value)}
            </span>
          </li>
        );
      })}
      <li className="ask-step flex items-center justify-between gap-3 rounded-xl bg-[#0b2545] text-white px-3 py-3" style={{ '--delay': `${c.steps.length * 70}ms` }}>
        <span className="flex items-center gap-2 text-[14px] font-semibold">
          {c.left < 0 ? <CircleX size={18} aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
          {c.left < 0 ? 'Short by' : 'What’s left'}
          <InfoTip light text="Everything above worked through in order. Below zero means your safety cushion would be used." />
        </span>
        <span className="tabular text-[17px] font-bold" title={`Exact: ${exact(c.left)}`}>{c.left < 0 ? '−' : '+'} {rounded(Math.abs(c.left))}</span>
      </li>
    </ol>
  );
}

function Waterfall({ c }) {
  const reduced = useReducedMotion();
  const rows = chartRows(c);
  return (
    <div className="hidden lg:block h-[330px]" role="img" aria-label={`Waterfall for a ${c.label.toLowerCase()}: ${rows.map((r) => `${r.name} ${exact(r.amount)}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} width={50} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip formatter={(_, __, p) => exact(p.payload.amount)} cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="range" radius={4} isAnimationActive={!reduced} animationDuration={600}>
            {rows.map((r) => <Cell key={r.name} fill={BAR_COLOR[r.kind]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CompareTable({ cases }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="bg-slate-50 text-slate-600">
            <th scope="col" className="px-3 py-2 font-semibold">Step</th>
            {cases.map((c) => <th key={c.key} scope="col" className="px-3 py-2 font-semibold text-right">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {cases[0].steps.map((s, i) => (
            <tr key={s.id} className="border-t border-slate-100">
              <th scope="row" className="px-3 py-2 font-normal text-slate-700">{s.label}</th>
              {cases.map((c) => <td key={c.key} className="px-3 py-2 text-right tabular" title={exact(c.steps[i].value)}>{s.sign} {rounded(c.steps[i].value)}</td>)}
            </tr>
          ))}
          <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-[#0b2545]">
            <th scope="row" className="px-3 py-2">What’s left</th>
            {cases.map((c) => <td key={c.key} className="px-3 py-2 text-right tabular" title={exact(c.left)}>{c.left < 0 ? '−' : '+'} {rounded(Math.abs(c.left))}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ShowHow({ cases }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('typical');
  const [compare, setCompare] = useState(false);
  const c = cases.find((x) => x.key === key);

  return (
    <section data-tour="how-calc" className="ask-card p-5 sm:p-6 space-y-4">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] rounded-lg">
        <span className="text-[17px] font-semibold text-[#0b2545]">Show how we worked it out</span>
        <ChevronDown size={20} className={`text-slate-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Which month to walk through" className="inline-flex gap-1 p-1 rounded-xl bg-slate-100">
              {cases.map((x) => (
                <button key={x.key} type="button" aria-pressed={!compare && x.key === key} onClick={() => { setKey(x.key); setCompare(false); }}
                  className={`${TOGGLE} ${!compare && x.key === key ? 'bg-white text-[#0b2545] shadow-sm' : 'text-slate-600 hover:text-[#0b2545]'}`}>
                  {x.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setCompare(!compare)} className="text-[13px] font-semibold text-[#1d4ed8] hover:underline">
              {compare ? 'Back to one month' : 'Compare all three'}
            </button>
          </div>
          {compare ? (
            <CompareTable cases={cases} />
          ) : (
            <>
              <p className="text-[13px] text-slate-600">A {c.label.toLowerCase()}: {c.hint}.</p>
              <div className="grid lg:grid-cols-2 gap-5 items-start">
                <Steps c={c} />
                <Waterfall c={c} />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
