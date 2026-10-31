// The top of the page: "Your goals", one plain sentence, a status pill, the monthly capacity bar, and the gullak
// filling to the overall percent saved with a count-up total.
import { Plus } from 'lucide-react';
import CapacityBar from './CapacityBar';
import Gullak from './Gullak';
import { STATUS } from './goalKit';
import { useCountUp } from '../../hooks/useMotion';
import { exact, shortRupees } from '../../utils/money';

const PILL = {
  low_ok: 'On track even in a low month', usual_ok: 'On track in a usual month', needs_more: 'Needs more', none: 'All funded',
};

export default function GoalsHero({ goals, view, totals, onNew }) {
  const saved = useCountUp(totals.saved, true, 900);
  const status = STATUS[view.bucket] || STATUS.none;
  const Icon = status.icon;
  const live = goals.filter((g) => g.statusCode !== 'funded');
  return (
    <section data-tour="plan-goals" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2545] via-[#123a8a] to-[#1d4ed8] p-6 sm:p-8 text-white shadow-lg" aria-labelledby="goals-hero">
      <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h1 id="goals-hero" className="text-[30px] sm:text-[36px] font-extrabold tracking-tight">Your goals</h1>
            <button type="button" onClick={onNew} className="shrink-0 inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-white text-[#0b2545] text-[15px] font-semibold shadow hover:bg-blue-50 transition-colors">
              <Plus size={18} aria-hidden="true" /> New goal
            </button>
          </div>
          {view.summary && <p className="mt-2 max-w-xl text-[17px] leading-relaxed text-blue-50">{view.summary}</p>}
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[14px] font-semibold text-[#0b2545]">
            <Icon size={17} className={status.text} aria-hidden="true" /> {PILL[view.bucket] || PILL.none}
          </span>
          {view.count > 0 && <CapacityBar goals={live} view={view} />}
        </div>
        <div className="flex flex-col items-center">
          <Gullak percent={totals.percent} className="w-56 sm:w-64" />
          <p className="mt-1 tabular-nums text-[34px] font-extrabold leading-none" title={`Exact: ${exact(totals.saved)}`}>{shortRupees(saved)}</p>
          <p className="mt-1 text-[14px] text-blue-100">saved of {shortRupees(totals.target)} <span className="sr-only">in total</span></p>
        </div>
      </div>
    </section>
  );
}
