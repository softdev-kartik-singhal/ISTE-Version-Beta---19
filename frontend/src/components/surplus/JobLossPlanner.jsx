// "If your income suddenly stopped": how many months the money in the bank would last, and which non-essential
// expenses could be stopped to make it last longer, each with the months it adds. Switch expenses off to see the total move.
// The sum is plain arithmetic: months = money in the bank / monthly spending (the same as the server's, which is tested).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Check, CircleHelp, LifeBuoy, RotateCcw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getSurvival } from '../../services/api';
import ToggleSwitch from '../ui/ToggleSwitch';
import { formatCurrency } from '../../utils/formatCurrency';

const money = (n) => formatCurrency(Math.round(n));
const months = (n) => (n >= 100 ? '100+' : n.toFixed(1));

// "until Oct 2027": the date the money would run out, counted from the latest statement.
function runsOutIn(asOf, monthsLeft) {
  const d = new Date(`${asOf}T00:00:00`);
  d.setDate(d.getDate() + Math.round(monthsLeft * 30.4375));
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function Stat({ label, value, note }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-space-md">
      <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
      <p className="font-currency-hero text-currency-hero text-on-surface font-semibold tracking-tight mt-1">{value}</p>
      {note && <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{note}</p>}
    </div>
  );
}

function Bar({ label, value, max, tone }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-label-md text-label-md text-on-surface">
        <span>{label}</span>
        <span className="font-semibold">{months(value)} months</span>
      </div>
      <div className="h-3 rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full transition-all duration-500 motion-reduce:transition-none ${tone}`} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export default function JobLossPlanner() {
  const api = useApi(getSurvival);
  const [stopped, setStopped] = useState(new Set()); // ids of the expenses switched off
  if (!api.ready) return null; // an extra section: nothing to show until there is data

  const s = api.data;
  const saved = s.cuts.filter((c) => stopped.has(c.id)).reduce((sum, c) => sum + c.monthly, 0);
  const spendAfter = s.spend - saved;
  const monthsAfter = spendAfter > 0 ? s.cash / spendAfter : null; // same formula as the server
  const gained = monthsAfter != null ? monthsAfter - s.monthsNow : 0;
  const top = Math.max(s.monthsLean, monthsAfter || 0, s.monthsNow, 1);

  function toggle(id, on) {
    const next = new Set(stopped);
    if (on) next.add(id); else next.delete(id);
    setStopped(next);
  }

  return (
    <section id="job-loss-planner" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg">
      <div className="flex items-start gap-space-sm">
        <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0"><LifeBuoy size={22} /></div>
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">If your income suddenly stopped</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">How long your money would last, and what you could stop to make it last longer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <Stat label="Money you have" value={money(s.cash)} note="Across all your accounts" />
        <Stat label="You spend each month" value={money(s.spend)} note="Your usual month" />
        <Stat label="Your money would last" value={`${months(s.monthsNow)} months`} note={`Until about ${runsOutIn(s.asOf, s.monthsNow)}`} />
      </div>

      <div className="space-y-space-sm">
        <Bar label="As you spend now" value={s.monthsNow} max={top} tone="bg-surface-tint" />
        <Bar label={stopped.size ? `After stopping ${stopped.size} thing${stopped.size === 1 ? '' : 's'}` : 'After stopping what you pick below'} value={monthsAfter ?? s.monthsNow} max={top} tone="bg-emerald-600" />
        {stopped.size > 0 && monthsAfter != null && (
          <p className="font-body-md text-body-md text-on-surface">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800"><Check size={16} /> +{gained.toFixed(1)} months</span>
            {' '}— you would save {money(saved)} a month and your money would last until about {runsOutIn(s.asOf, monthsAfter)}.
          </p>
        )}
      </div>

      <div className="space-y-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">What you could stop</h3>
          <div className="flex items-center gap-space-sm">
            <button type="button" className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary" onClick={() => setStopped(new Set(s.cuts.map((c) => c.id)))}>
              Stop all
            </button>
            <button type="button" disabled={stopped.size === 0} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high disabled:opacity-50 flex items-center gap-1" onClick={() => setStopped(new Set())}>
              <RotateCcw size={14} /> Clear
            </button>
          </div>
        </div>
        {s.cuts.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Nothing extra found: everything you spend is on essentials.</p>
        ) : (
          <ul className="divide-y divide-[#E3E8EF]/70">
            {s.cuts.map((c) => (
              <li key={c.id} className="py-3 flex items-center justify-between gap-space-md">
                <label className="flex items-center gap-space-md min-w-0 cursor-pointer">
                  <ToggleSwitch checked={stopped.has(c.id)} onChange={(on) => toggle(c.id, on)} />
                  <span className="min-w-0">
                    <span className="block font-body-md text-body-md font-semibold text-on-surface truncate">{c.name}</span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant">{money(c.monthly)} a month{c.kind === 'subscription' ? ' · subscription' : ''}</span>
                  </span>
                </label>
                <span className="font-label-md text-label-md font-semibold text-emerald-800 shrink-0 whitespace-nowrap">+{c.addsMonths.toFixed(2)} months</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl bg-surface-container-low p-space-md space-y-space-sm">
        <p className="font-body-md text-body-md text-on-surface">
          <span className="font-semibold">Even if you stopped everything above</span>, your essentials would still cost {money(s.leanSpend)} a month, so your money would last{' '}
          <span className="font-semibold">{months(s.monthsLean)} months</span> (until about {runsOutIn(s.asOf, s.monthsLean)}).
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Essentials that carry on">
          {s.essentials.map((e) => (
            <li key={e.name} className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-[#E3E8EF] font-label-sm text-label-sm text-on-surface">
              {e.name} <span className="font-semibold">{money(e.monthly)}</span>
            </li>
          ))}
        </ul>
        <p className="font-label-sm text-label-sm text-on-surface-variant flex items-start gap-1.5">
          <CircleHelp size={14} className="shrink-0 mt-0.5" />
          <span>
            An estimate from your usual spending, assuming no income at all. It leaves out severance, unemployment benefit and any new income.
            Rent and EMI are the biggest costs; <Link to="/goals" className="text-primary hover:underline">review your goals</Link> if you want to protect them.
          </span>
        </p>
        <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5"><CalendarClock size={14} /> Counted from your latest statement.</p>
      </div>
    </section>
  );
}
