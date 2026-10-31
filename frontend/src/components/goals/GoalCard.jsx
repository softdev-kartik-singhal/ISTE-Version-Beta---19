// One goal: icon + name + category + target and date, a progress ring with milestone ticks, one status line,
// the monthly amount, "See the calculation", and the actions: Add money, Edit and a "more" menu.
import { useEffect, useRef, useState } from 'react';
import { CircleCheck, Ellipsis, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import ProgressRing, { MilestoneTrack } from './ProgressRing';
import { STATUS, fullDate, inMonths, monthYear, tileFor } from './goalKit';
import { exact, rounded } from '../../utils/money';

// The "more" menu opens upward so it is never clipped by the card below; Escape and outside clicks close it.
function MoreMenu({ goal, onAsk, onComplete, onDelete }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => (e.type === 'keydown' ? e.key === 'Escape' && setOpen(false) : !box.current?.contains(e.target) && setOpen(false));
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  const item = 'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] hover:bg-slate-50';
  const pick = (fn) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div ref={box} className="relative">
      <button type="button" aria-label={`More actions for ${goal.name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center">
        <Ellipsis size={20} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 bottom-12 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {onAsk && <button role="menuitem" type="button" className={`${item} text-slate-800`} onClick={pick(onAsk)}><Sparkles size={16} className="text-[#1d4ed8]" aria-hidden="true" /> Check in Ask</button>}
          <button role="menuitem" type="button" className={`${item} text-slate-800`} onClick={pick(onComplete)}><CircleCheck size={16} className="text-emerald-600" aria-hidden="true" /> Mark complete</button>
          <button role="menuitem" type="button" className={`${item} text-red-700`} onClick={pick(onDelete)}><Trash2 size={16} aria-hidden="true" /> Delete</button>
        </div>
      )}
    </div>
  );
}

export default function GoalCard({ goal, index, onAdd, onEdit, onCalc, onAsk, onComplete, onDelete }) {
  const tile = tileFor(goal.rawName, goal.category);
  const Icon = tile.icon;
  const status = STATUS[goal.statusCode];
  const StatusIcon = status.icon;
  const perMonth = goal.monthsFromToday > 0 && goal.remaining > 0;
  return (
    <article className="goal-card goal-in rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col gap-5" style={{ '--delay': `${index * 80}ms` }}>
      <header className="flex items-start gap-3.5">
        <span className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center ${tile.tint}`}><Icon size={23} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-[19px] font-bold leading-tight text-[#0b2545] truncate">{goal.name}</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-medium text-slate-600">{goal.category}</span>
          </div>
          <p className="mt-1 text-[14px] text-slate-600">
            <span className="font-semibold text-[#0b2545] tabular-nums" title={`Exact: ${exact(goal.target)}`}>{rounded(goal.target)}</span>
            {' '}by {fullDate(goal.targetDate)} · {inMonths(goal.monthsFromToday)}
          </p>
        </div>
      </header>

      <div className="flex flex-col items-center gap-4">
        <ProgressRing percent={goal.percent} saved={goal.saved} color={status.ring} />
        <MilestoneTrack percent={goal.percent} />
      </div>

      <div className="space-y-1.5 text-center">
        <p className={`flex items-center justify-center gap-2 text-[15px] font-semibold ${status.text}`}>
          <StatusIcon size={18} aria-hidden="true" /> {goal.statusLine}
        </p>
        {perMonth
          ? <p className="text-[14px] text-slate-600"><span className="font-semibold text-[#0b2545] tabular-nums">{exact(goal.monthlyNow)}</span> a month until {monthYear(goal.targetDate)}</p>
          : goal.statusCode === 'overdue' && <p className="text-[14px] text-slate-600">Pick a new date to see the monthly amount.</p>}
        <button type="button" onClick={onCalc} className="text-[14px] font-semibold text-[#1d4ed8] hover:underline underline-offset-4">See the calculation</button>
      </div>

      <footer className="mt-auto flex items-center gap-2.5">
        <button type="button" onClick={onAdd} className="flex-1 h-10 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-[15px] font-semibold flex items-center justify-center gap-1.5 transition-colors">
          <Plus size={17} aria-hidden="true" /> Add money
        </button>
        <button type="button" onClick={onEdit} className="h-10 px-4 rounded-xl border border-slate-200 text-[15px] font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-1.5">
          <Pencil size={15} aria-hidden="true" /> Edit
        </button>
        <MoreMenu goal={goal} onAsk={goal.monthsLeft > 0 ? onAsk : null} onComplete={onComplete} onDelete={onDelete} />
      </footer>
    </article>
  );
}
