// "See the calculation": the same steps as the Ask page. Still needed = target - saved; months from today to the date;
// monthly need = still needed / months; then that amount against a low, a usual and a good month's leftover.
import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { fullDate } from './goalKit';
import { exact } from '../../utils/money';

const Step = ({ n, title, children }) => (
  <li className="flex gap-3.5">
    <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-blue-50 text-[#1d4ed8] text-[13px] font-bold flex items-center justify-center">{n}</span>
    <div>
      <p className="text-[14px] text-slate-600">{title}</p>
      <p className="text-[16px] font-semibold text-[#0b2545] tabular-nums">{children}</p>
    </div>
  </li>
);

export default function CalcDrawer({ goal, view, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const need = goal.monthlyNow;
  const months = [
    { label: 'Low month', value: view.low }, { label: 'Usual month', value: view.usual }, { label: 'Good month', value: view.good },
  ];
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-[#0b2545]/40 backdrop-blur-[2px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-label={`How ${goal.name} was worked out`} className="drawer-in h-full w-full sm:max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold text-[#0b2545]">{goal.name}</h2>
            <p className="text-[14px] text-slate-600">How the monthly amount is worked out</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"><X size={20} aria-hidden="true" /></button>
        </div>
        <ol className="mt-6 space-y-5">
          <Step n={1} title="Still needed">{exact(goal.target)} − {exact(goal.saved)} = {exact(goal.remaining)}</Step>
          <Step n={2} title={`Months from today to ${fullDate(goal.targetDate)}`}>{goal.monthsFromToday} {goal.monthsFromToday === 1 ? 'month' : 'months'}</Step>
          <Step n={3} title="Needed each month">{exact(goal.remaining)} ÷ {goal.monthsFromToday || 1} = {exact(need)}</Step>
        </ol>

        <h3 className="mt-7 text-[14px] font-semibold text-[#0b2545]">Against what you have left each month</h3>
        <ul className="mt-3 space-y-2.5">
          {months.map((m) => {
            const fits = need <= m.value;
            return (
              <li key={m.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
                <span className="text-[14px] text-slate-700">{m.label} <span className="font-semibold text-[#0b2545] tabular-nums">{exact(m.value)}</span></span>
                <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${fits ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {fits ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />} {fits ? 'This goal fits' : 'Not enough'}
                </span>
              </li>
            );
          })}
        </ul>
        {view.count > 1 && (
          <p className="mt-4 rounded-xl bg-slate-50 p-3.5 text-[14px] text-slate-700">
            All your goals together need <strong className="tabular-nums text-[#0b2545]">{exact(view.total)}</strong> a month. The status on the card uses that total, not this goal alone.
          </p>
        )}
      </aside>
    </div>
  );
}
