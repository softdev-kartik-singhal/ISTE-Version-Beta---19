// "Try a change": switch off subscriptions or add a new EMI and see the answer move, using the same method as the
// main answer (the backend's what-if). Before → after for a usual month, with the difference in ₹ and %.
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CircleAlert, Tv } from 'lucide-react';
import RangeBar from './RangeBar';
import VerdictBadge from '../ui/VerdictBadge';
import { askWhatIf } from '../../services/api';
import { exact, rounded } from '../../utils/money';
import { formatCurrency } from '../../utils/formatCurrency';

const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const join = (names) => (names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

// The one-line result: "Cancelling Spotify and Netflix adds ₹768/month".
function resultLine(subs, cancelled, emi) {
  const parts = [];
  const chosen = subs.filter((s) => cancelled.has(s.merchant));
  if (chosen.length) parts.push(`Cancelling ${join(chosen.map((s) => s.name))} adds ${formatCurrency(sum(chosen.map((s) => s.monthly)))}/month`);
  if (emi > 0) parts.push(`A new EMI takes ${formatCurrency(emi)}/month`);
  return parts.join(' · ');
}

// amount (₹) and month ('2026-10'): the question being answered; monthsAhead: months the answer covers (a monthly saving
// counts that many times); subs: from toSubscriptions(); bonusOn: whether the main answer includes a bonus
export default function TryAChange({ amount, month, monthsAhead, subs, bonusOn }) {
  const [cancelled, setCancelled] = useState(new Set());
  const [emiText, setEmiText] = useState('');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const latest = useRef(0);
  const emi = Number(emiText) > 0 ? Number(emiText) : 0;
  const touched = cancelled.size > 0 || emi > 0;

  // Re-ask the backend a moment after each change; ignore answers that arrive late.
  useEffect(() => {
    if (!touched) return undefined;
    const id = ++latest.current;
    const t = setTimeout(async () => {
      try {
        const out = await askWhatIf(amount, month, [...cancelled], emi);
        if (id === latest.current) { setRes(out); setError(''); }
      } catch (err) {
        if (id === latest.current) setError(err.message);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [amount, month, cancelled, emi, touched]);

  function toggle(merchant) {
    const next = new Set(cancelled);
    if (next.has(merchant)) next.delete(merchant); else next.add(merchant);
    setCancelled(next);
    if (!next.size && !emi) setRes(null);
  }

  const shown = touched ? res : null;
  const up = shown && shown.diff >= 0;
  return (
    <section className="ask-card p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-[17px] font-semibold text-[#0b2545]">Try a change</h2>
        <p className="text-[12px] text-slate-500 mt-0.5">Using the same method as your answer.{bonusOn && ' Shown without the bonus.'}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subs.map((s) => {
          const on = cancelled.has(s.merchant);
          return (
            <button key={s.merchant} type="button" aria-pressed={on} onClick={() => toggle(s.merchant)}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] ${on ? 'border-[#1d4ed8] bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <span className="flex items-center gap-3 min-w-0">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${on ? 'bg-[#1d4ed8] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {on ? <Check size={17} aria-hidden="true" /> : <Tv size={17} aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-[#0b2545] truncate">{s.name}</span>
                  <span className="block text-[12px] text-slate-600">{on ? 'Cancelled' : 'Cancel it'}</span>
                </span>
              </span>
              <span className="tabular text-[14px] font-semibold text-[#0b2545] shrink-0" title={`Exact: ${exact(s.monthly)}`}>{rounded(s.monthly)}/mo</span>
            </button>
          );
        })}
        <label className="flex flex-col justify-center gap-1 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-[12px] font-medium text-slate-600 sm:col-span-2 lg:col-span-1">
          Add a new EMI (₹ per month)
          <input type="number" min="0" inputMode="numeric" placeholder="e.g. 5000" value={emiText} onChange={(e) => setEmiText(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-100 text-[14px] text-[#0b2545] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]" />
        </label>
      </div>
      {subs.length === 0 && <p className="text-[13px] text-slate-600">No subscriptions found in your statements, but you can still try adding an EMI.</p>}

      {error && <p role="alert" className="flex items-center gap-1.5 text-[13px] text-red-700"><CircleAlert size={15} aria-hidden="true" /> {error}</p>}

      {shown && (
        <div className="ask-pop rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3" aria-live="polite">
          <p className="text-[15px] font-semibold text-[#0b2545]">{resultLine(subs, cancelled, emi)}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
            <span className="text-slate-600">Usual month:</span>
            <span className="tabular" title="Your answer now">{formatCurrency(shown.before.typical)}</span>
            <ArrowRight size={15} className="text-slate-400" aria-hidden="true" />
            <strong className="tabular text-[#0b2545]">{formatCurrency(shown.after.typical)}</strong>
            <span className={`tabular font-semibold ${up ? 'text-emerald-700' : 'text-red-700'}`}>
              {up ? '+' : '−'}{formatCurrency(Math.abs(shown.diff))}{shown.pct != null && ` (${up ? '+' : '−'}${Math.abs(shown.pct).toFixed(1)}%)`}
            </span>
            {monthsAhead > 1 && <span className="text-[13px] text-slate-500">over the {monthsAhead} months to then</span>}
          </p>
          {shown.changed && (
            <p className="flex flex-wrap items-center gap-2 text-[13px] text-slate-700">
              The verdict changes: <VerdictBadge state={shown.stateBefore} size="sm" /> <ArrowRight size={14} aria-hidden="true" /> <VerdictBadge state={shown.stateAfter} size="sm" />
            </p>
          )}
          <RangeBar values={shown.after} ghost={shown.before} ghostLabel="Before" />
        </div>
      )}
    </section>
  );
}
