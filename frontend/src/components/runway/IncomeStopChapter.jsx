// Chapter 02: "If your income suddenly stopped". The jars are months of money; a label marks where it runs out and glides when
// the number changes; a dashed marker shows the result after switching things off. Every monthly cost is a toggle switch that
// starts ON (you keep paying it); turn one OFF and the strip grows live.
// months = money in the bank / monthly spending (the server's own formula, which is tested).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Check, CircleHelp, RotateCcw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getSurvival } from '../../services/api';
import Chapter from './Chapter';
import MonthStrip from './MonthStrip';
import InfoTip from '../ui/InfoTip';
import ToggleSwitch from '../ui/ToggleSwitch';
import { clamp, monthsFromToday, monthsText } from './runwayKit';
import { formatCurrency } from '../../utils/formatCurrency';

const money = (n) => formatCurrency(Math.round(n));
const statementDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
// Glides a number to a new value over ~500ms each time it changes (jumps straight there with reduced motion).
function useGlide(target) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target;
      setShown(target);
      return undefined;
    }
    const start = from.current;
    const t0 = performance.now();
    let frame;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 500);
      const v = start + (target - start) * (1 - (1 - p) ** 3); // ease-out
      from.current = v;
      setShown(v);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return shown;
}

const GROUPS = [{ key: 'essential', title: 'Essentials' }, { key: 'everyday', title: 'Everyday' }, { key: 'subscription', title: 'Subscriptions' }];

const Stat = ({ label, note, tip, children }) => (
  <div className="px-0 py-4 sm:px-6 sm:first:pl-0 sm:last:pr-0">
    <dt className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-slate-500">{label}{tip}</dt>
    <dd className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-[#0b2545] tabular-nums">{children}</dd>
    {note && <p className="mt-1 text-[14px] text-slate-600">{note}</p>}
  </div>
);

function Legend({ swatch, label, value, tip }) {
  return (
    <li className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] text-slate-800">
      <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${swatch}`} aria-hidden="true" />
      <span>{label}</span>
      <strong className="tabular-nums text-[#0b2545]">{value}</strong>
      {tip}
    </li>
  );
}

// The live result, pinned under the top bar while the user works through the switches: the new runway in big numbers,
// how much it changed, and what is being saved. The sentence is also read out for screen readers (aria-live).
function LiveResult({ now, after, saved, untilDate, changed }) {
  const shownAfter = useGlide(after ?? now);
  const delta = (after ?? now) - now;
  const never = after == null;
  return (
    <div className="sticky top-[116px] z-20 -mx-1 mb-6 rounded-2xl bg-[#0b2545] px-5 py-4 text-white shadow-lg sm:px-6">
      <div className="grid grid-cols-1 items-center gap-x-8 gap-y-3 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-blue-200">Your money would last</p>
          <p className="flex items-baseline gap-2">
            <span className="text-[40px] font-extrabold leading-none tracking-tight tabular-nums sm:text-[46px]">{never ? '∞' : monthsText(shownAfter)}</span>
            <span className="text-[16px] font-semibold text-blue-100">{never ? 'nothing left to pay' : 'months'}</span>
          </p>
          {!never && <p className="mt-0.5 text-[13px] text-blue-200">until about {untilDate}</p>}
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-blue-200">Compared with now</p>
          <p key={changed} className={`result-bump mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[18px] font-extrabold tabular-nums ${changed ? 'bg-emerald-400 text-[#0b2545]' : 'bg-white/15 text-white'}`}>
            {changed ? <><Check size={17} strokeWidth={3} aria-hidden="true" /> +{never ? '∞' : delta.toFixed(1)} months</> : 'No change yet'}
          </p>
          <p className="mt-1 text-[13px] text-blue-200">It was {monthsText(now)} months</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-blue-200">You would save</p>
          <p className="mt-1 text-[22px] font-extrabold tabular-nums">{money(saved)} <span className="text-[14px] font-medium text-blue-200">a month</span></p>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {changed ? (never ? 'You would stop paying everything, so there would be nothing to spend your money on.' : `Your money would last ${monthsText(after)} months, until about ${untilDate}: ${delta.toFixed(1)} months more, saving ${money(saved)} a month.`) : `Everything is switched on. Your money would last ${monthsText(now)} months.`}
      </p>
    </div>
  );
}

// One monthly cost as a toggle-switch row. ON = you keep paying it; OFF = stopped (struck through, with the months it adds).
function ToggleRow({ item, on, adds, onToggle }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <label className="flex min-w-0 cursor-pointer items-center gap-4">
        <ToggleSwitch checked={on} onChange={onToggle} />
        <span className="min-w-0">
          <span className={`block truncate text-[16px] font-semibold ${on ? 'text-[#0b2545]' : 'text-slate-500 line-through'}`}>{item.name}</span>
          <span className="block text-[13px] text-slate-600">
            {money(item.monthly)} a month{item.tag ? ` · ${item.tag}` : ''}
            <span className="sr-only">{on ? ', still paying' : ', stopped'}</span>
          </span>
        </span>
      </label>
      {on
        ? <span className="shrink-0 whitespace-nowrap text-[13px] text-slate-600">{adds != null ? `+${adds.toFixed(2)} months if stopped` : 'Last cost left'}</span>
        : <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[14px] font-bold text-emerald-800"><Check size={14} aria-hidden="true" />{adds != null ? `+${adds.toFixed(2)} months` : 'Stopped'}</span>}
    </li>
  );
}

export default function IncomeStopChapter() {
  const api = useApi(getSurvival);
  const [off, setOff] = useState(new Set()); // ids of the costs switched OFF (stopped). Nothing is off to begin with.
  if (!api.ready) return null; // an extra chapter: nothing to show until there is data

  const s = api.data;
  const items = [
    ...s.essentials.map((e) => ({ id: `essential:${e.name}`, name: e.name, monthly: e.monthly, group: 'essential', tag: 'essential' })),
    ...s.cuts.map((c) => ({ id: c.id, name: c.name, monthly: c.monthly, group: c.kind === 'subscription' ? 'subscription' : 'everyday', tag: c.kind === 'subscription' ? 'subscription' : '' })),
  ].sort((a, b) => b.monthly - a.monthly);

  const stoppedTotal = items.filter((i) => off.has(i.id)).reduce((sum, i) => sum + i.monthly, 0);
  const spendNow = Math.max(0, s.spend - stoppedTotal); // what is still paid with the current switches
  const monthsAfter = spendNow > 0 ? s.cash / spendNow : null; // same formula as the server; null = nothing left to pay
  const after = monthsAfter ?? s.monthsNow;
  const gained = after - s.monthsNow;
  // Months one switch adds right now, given every other switch.
  const worth = (i) => {
    const withIt = off.has(i.id) ? spendNow + i.monthly : spendNow;
    const without = withIt - i.monthly;
    return without > 0 ? s.cash / without - s.cash / withIt : null;
  };

  const top = Math.min(36, Math.max(s.monthsLean, after, s.monthsNow, 3));
  const count = clamp(Math.ceil(top) + 1, 6, 36);
  const jars = Array.from({ length: count }, (_, i) => {
    const base = clamp(s.monthsNow - i, 0, 1);
    return { fill: base, extra: Math.max(0, clamp(after - i, 0, 1) - base), tone: 'spend' };
  });
  const markers = [
    { id: 'now', at: Math.min(s.monthsNow, count), lane: 'top', tone: 'blue', label: `${monthsText(s.monthsNow)} months — until ${monthsFromToday(s.monthsNow)}` },
    { id: 'after', at: Math.min(after, count), lane: 'bottom', tone: 'green', dashed: true,
      label: off.size ? `After stopping: ${monthsText(after)} months — until ${monthsFromToday(after)}` : `After stopping what you switch off: ${monthsText(after)} months` },
  ];

  function toggle(id, keepPaying) {
    const next = new Set(off);
    if (keepPaying) next.delete(id); else next.add(id);
    setOff(next);
  }

  return (
    <Chapter n="02" id="job-loss-planner" title="If your income suddenly stopped">
      <p className="-mt-4 mb-7 max-w-2xl text-[16px] text-slate-600">How long your money would last, and where you could save to make it last longer.</p>

      <dl className="grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat label="Money you have" note="Across all your accounts">{money(s.cash)}</Stat>
        <Stat label="You spend each month" note="Your usual month">{money(s.spend)}</Stat>
        <Stat
          label="Your money would last" note={`Until about ${monthsFromToday(s.monthsNow)}`}
          tip={<InfoTip text={`${monthsText(s.monthsNow)} months is at your usual spending, everything included. If you only paid the essentials, it would last ${monthsText(s.monthsLean)} months.`} />}
        >
          {monthsText(s.monthsNow)} months
        </Stat>
      </dl>

      <div className="mt-8">
        <MonthStrip count={count} jars={jars} markers={markers} ariaLabel={`Your money would last ${monthsText(s.monthsNow)} months at your usual spending`} />
      </div>

      <ul className="mt-2 space-y-2.5" aria-label="What the markers mean">
        <Legend swatch="bg-[#1d4ed8]" label="As you spend now" value={`${monthsText(s.monthsNow)} months`} tip={<InfoTip text="Your usual month's spending, with everything switched on." />} />
        <Legend swatch="border-2 border-dashed border-emerald-600 bg-emerald-100" label={off.size ? `After stopping ${off.size} thing${off.size === 1 ? '' : 's'}` : 'After stopping what you switch off below'} value={monthsAfter == null ? 'nothing left to pay' : `${monthsText(after)} months`} />
        <Legend swatch="bg-slate-300" label="Essentials only" value={`${monthsText(s.monthsLean)} months`} tip={<InfoTip text={`The longest your money could last while still paying the essentials. It is not the same as ${monthsText(s.monthsNow)} months, which is your usual spending.`} />} />
      </ul>

      <div className="mt-8">
        <LiveResult now={s.monthsNow} after={monthsAfter} saved={stoppedTotal} untilDate={monthsAfter != null ? monthsFromToday(monthsAfter) : ''} changed={off.size > 0} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[20px] font-bold text-[#0b2545]">Everything you pay each month</h3>
          <div className="flex items-center gap-2.5">
            <button type="button" title="Switch off everything except the essentials" onClick={() => setOff(new Set(s.cuts.map((c) => c.id)))} className="h-10 rounded-full bg-[#1d4ed8] px-5 text-[14px] font-semibold text-white hover:bg-[#1e40af]">Stop all non-essentials</button>
            <button type="button" title="Switch everything back on" disabled={off.size === 0} onClick={() => setOff(new Set())} className="flex h-10 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 text-[14px] font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-45">
              <RotateCcw size={14} aria-hidden="true" /> Clear
            </button>
          </div>
        </div>
        <div className="mt-5 space-y-6">
          {GROUPS.map((g) => {
            const list = items.filter((i) => i.group === g.key);
            if (!list.length) return null;
            return (
              <div key={g.key} role="group" aria-label={g.title}>
                <p className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-slate-500">{g.title}</p>
                <ul className="divide-y divide-slate-200 border-y border-slate-200">
                  {list.map((i) => <ToggleRow key={i.id} item={i} on={!off.has(i.id)} adds={worth(i)} onToggle={(keepPaying) => toggle(i.id, keepPaying)} />)}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-blue-50/70 p-5 ring-1 ring-blue-100 sm:p-6">
        <p className="text-[16px] leading-relaxed text-slate-800">
          <span className="font-semibold">If you stopped everything except the essentials</span> ({s.essentials.map((e) => e.name).join(', ')}), you would still spend {money(s.leanSpend)} a month, so your money would last{' '}
          <span className="font-semibold">{monthsText(s.monthsLean)} months</span> (until about {monthsFromToday(s.monthsLean)}).
        </p>
        <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-relaxed text-slate-600">
          <CircleHelp size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            An estimate from your usual spending, assuming no income at all. It leaves out severance, unemployment benefit and any new income.
            Rent and EMI are the biggest costs; <Link to="/goals" className="font-semibold text-[#1d4ed8] hover:underline">review your goals</Link> if you want to protect them.
          </span>
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-slate-600"><CalendarClock size={15} aria-hidden="true" /> Counted from today, using your statements up to {statementDay(s.asOf)}.</p>
      </div>
    </Chapter>
  );
}
