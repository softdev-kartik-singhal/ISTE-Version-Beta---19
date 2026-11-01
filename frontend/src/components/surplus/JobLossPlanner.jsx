// "If your income suddenly stopped": how many months the money in the bank would last, and where you could save to make it last longer.
// Every monthly cost is listed and starts ON (you keep paying it). Switch one OFF to stop paying it and watch the months grow.
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

function Bar({ label, value, max, tone, text }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-label-md text-label-md text-on-surface">
        <span>{label}</span>
        <span className="font-semibold">{text || `${months(value)} months`}</span>
      </div>
      <div className="h-3 rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full transition-all duration-500 motion-reduce:transition-none ${tone}`} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export default function JobLossPlanner() {
  const api = useApi(getSurvival);
  const [off, setOff] = useState(new Set()); // ids of the costs switched OFF (stopped). Nothing is off to begin with.
  if (!api.ready) return null; // an extra section: nothing to show until there is data

  const s = api.data;
  // Everything the user pays each month: the essentials first listed by the server, then everything else, biggest first.
  const items = [
    ...s.essentials.map((e) => ({ id: `essential:${e.name}`, name: e.name, monthly: e.monthly, tag: 'essential' })),
    ...s.cuts.map((c) => ({ id: c.id, name: c.name, monthly: c.monthly, tag: c.kind === 'subscription' ? 'subscription' : '' })),
  ].sort((a, b) => b.monthly - a.monthly);

  const stoppedTotal = items.filter((i) => off.has(i.id)).reduce((sum, i) => sum + i.monthly, 0);
  const spendNow = Math.max(0, s.spend - stoppedTotal);          // what is still being paid with the current switches
  const lasts = (spend) => (spend > 0 ? s.cash / spend : null);   // same formula as the server; null = nothing left to pay
  const monthsAfter = lasts(spendNow);
  const gained = monthsAfter != null ? monthsAfter - s.monthsNow : null;
  const top = Math.max(s.monthsLean, monthsAfter || 0, s.monthsNow, 1);

  // Months a single switch adds right now, given every other switch (OFF rows: what stopping it is worth; ON rows: what it would be worth).
  const worth = (i) => {
    const withIt = off.has(i.id) ? spendNow + i.monthly : spendNow;   // spending if this one were still paid
    const without = withIt - i.monthly;                               // spending if it were stopped
    return without > 0 ? s.cash / without - s.cash / withIt : null;
  };

  function toggle(id, keepPaying) {
    const next = new Set(off);
    if (keepPaying) next.delete(id); else next.add(id);
    setOff(next);
  }
  const stopExtras = () => setOff(new Set(s.cuts.map((c) => c.id)));

  return (
    <section id="job-loss-planner" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg">
      <div className="flex items-start gap-space-sm">
        <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0"><LifeBuoy size={22} /></div>
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">If your income suddenly stopped</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">How long your money would last, and where you could save to make it last longer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <Stat label="Money you have" value={money(s.cash)} note="Across all your accounts" />
        <Stat label="You spend each month" value={money(s.spend)} note="Your usual month" />
        <Stat label="Your money would last" value={`${months(s.monthsNow)} months`} note={`Until about ${runsOutIn(s.asOf, s.monthsNow)}`} />
      </div>

      <div className="space-y-space-sm" aria-live="polite">
        <Bar label="As you spend now" value={s.monthsNow} max={top} tone="bg-surface-tint" />
        <Bar
          label={off.size ? `After stopping ${off.size} thing${off.size === 1 ? '' : 's'}` : 'After stopping what you switch off below'}
          value={monthsAfter ?? top} max={top} tone="bg-emerald-600" text={monthsAfter == null ? 'Nothing left to pay' : undefined}
        />
        {off.size > 0 && (
          <p className="font-body-md text-body-md text-on-surface">
            {monthsAfter != null ? (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800"><Check size={16} /> +{gained.toFixed(1)} months</span>
                {' '}— you would save {money(stoppedTotal)} a month and your money would last until about {runsOutIn(s.asOf, monthsAfter)}.
              </>
            ) : (
              <>You would stop paying everything, so there would be nothing to spend your money on.</>
            )}
          </p>
        )}
      </div>

      <div className="space-y-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Everything you pay each month</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Everything starts switched on. Switch off what you would stop paying and see how much longer your money lasts.</p>
          </div>
          <div className="flex items-center gap-space-sm">
            <button type="button" title="Switch off everything except the essentials" className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary" onClick={stopExtras}>
              Stop all non-essentials
            </button>
            <button type="button" disabled={off.size === 0} title="Switch everything back on" className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high disabled:opacity-50 flex items-center gap-1" onClick={() => setOff(new Set())}>
              <RotateCcw size={14} /> Clear
            </button>
          </div>
        </div>
        <ul className="divide-y divide-[#E3E8EF]/70">
          {items.map((i) => {
            const stopped = off.has(i.id);
            const adds = worth(i);
            return (
              <li key={i.id} className="py-3 flex items-center justify-between gap-space-md">
                <label className="flex items-center gap-space-md min-w-0 cursor-pointer">
                  <ToggleSwitch checked={!stopped} onChange={(on) => toggle(i.id, on)} />
                  <span className="min-w-0">
                    <span className={`block font-body-md text-body-md font-semibold truncate ${stopped ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>{i.name}</span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant">
                      {money(i.monthly)} a month{i.tag ? ` · ${i.tag}` : ''}
                      <span className="sr-only">{stopped ? ', stopped' : ', still paying'}</span>
                    </span>
                  </span>
                </label>
                {stopped
                  ? <span className="font-label-md text-label-md font-semibold text-emerald-800 shrink-0 whitespace-nowrap flex items-center gap-1"><Check size={14} />{adds != null ? `+${adds.toFixed(2)} months` : 'Stopped'}</span>
                  : <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 whitespace-nowrap">{adds != null ? `+${adds.toFixed(2)} months if stopped` : 'Last cost left'}</span>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl bg-surface-container-low p-space-md space-y-space-sm">
        <p className="font-body-md text-body-md text-on-surface">
          <span className="font-semibold">If you stopped everything except the essentials</span> ({s.essentials.map((e) => e.name).join(', ')}), you would still spend {money(s.leanSpend)} a month, so your money would last{' '}
          <span className="font-semibold">{months(s.monthsLean)} months</span> (until about {runsOutIn(s.asOf, s.monthsLean)}).
        </p>
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
