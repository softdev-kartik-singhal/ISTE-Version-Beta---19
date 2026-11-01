// Chapter 01, Step 1: emergency fund first. The month strip shows it: the first jars are the target zone (a few months of
// essentials, with a tick when reached) and any savings beyond it keep filling the next jars, with an "extra" badge.
// "How calculated" opens a drawer (a bottom sheet on phones) with the essentials, icons, mini bars and the total x months.
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CalendarDays, Check, Hourglass, SlidersHorizontal } from 'lucide-react';
import Chapter from './Chapter';
import Drawer from './Drawer';
import MonthStrip from './MonthStrip';
import { clamp, essentialIcon } from './runwayKit';
import { exact } from '../../utils/money';
import { formatCurrency } from '../../utils/formatCurrency';

const CELEBRATED = 'sg_ef_celebrated';

// Confetti only the first time the fund is seen complete (never again, and never with reduced motion).
function celebrateOnce() {
  try {
    if (localStorage.getItem(CELEBRATED)) return;
    localStorage.setItem(CELEBRATED, '1');
  } catch {
    /* storage unavailable: celebrate anyway */
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  confetti({ particleCount: 110, spread: 75, startVelocity: 38, ticks: 140, origin: { y: 0.35 }, zIndex: 2000000000 });
}

const Stat = ({ label, children, note, action }) => (
  <div className="px-0 py-4 sm:px-6 sm:first:pl-0 sm:last:pr-0">
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      {action}
    </div>
    <dd className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-[#0b2545] tabular-nums">{children}</dd>
    {note && <p className="mt-1 text-[14px] text-slate-600">{note}</p>}
  </div>
);

export default function EmergencyChapter({ fund, showBreakdown, onToggleBreakdown }) {
  const percent = Math.round((fund.saved / fund.target) * 100);
  const complete = fund.saved >= fund.target; // at or over 100%: no ETA, no "remaining" amount
  const covered = fund.monthlyBaseline > 0 ? fund.saved / fund.monthlyBaseline : 0; // months of essentials the savings cover
  const buffer = fund.bufferMonths;
  useEffect(() => { if (complete) celebrateOnce(); }, [complete]);

  const count = clamp(Math.ceil(Math.max(covered, buffer)) + 1, buffer + 2, 24);
  const jars = Array.from({ length: count }, (_, i) => ({
    fill: clamp(covered - i, 0, 1), tone: i < buffer ? 'target' : 'extra', ring: i < buffer,
  }));
  const zone = {
    to: buffer, progress: clamp(covered / buffer, 0, 1),
    label: <>{covered >= buffer && <Check size={14} strokeWidth={3} aria-hidden="true" />} Emergency fund target · {buffer} months{covered >= buffer ? ' reached' : ''}</>,
  };
  const markers = [{
    id: 'saved', at: Math.min(covered, count), lane: 'bottom', tone: 'blue', glow: true,
    label: `${fund.runway} saved${percent > 100 ? ` · +${percent - 100}% extra` : ''}`,
  }];
  const biggest = Math.max(...fund.essentials.map((e) => e.amount), 1);

  return (
    <Chapter
      n="01" id="emergency-fund" tag="Step 1" title="Emergency fund first"
      aside={<p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#1d4ed8]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#1d4ed8] motion-reduce:animate-none" /> Priority Allocation Active</p>}
    >
      <p className="-mt-4 mb-7 max-w-2xl text-[16px] text-slate-600">Build your baseline liquidity buffer.</p>
      <MonthStrip count={count} jars={jars} markers={markers} zone={zone} ariaLabel={`Your savings cover ${covered.toFixed(1)} months of essentials; the target is ${buffer} months`} />

      <dl className="mt-6 grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          label="Target Liquidity Floor" note={`(${buffer} months essential buffer)`}
          action={(
            <button type="button" onClick={onToggleBreakdown} aria-haspopup="dialog" className="flex items-center gap-1 text-[13px] font-semibold text-[#1d4ed8] hover:underline">
              <SlidersHorizontal size={14} aria-hidden="true" /> How calculated
            </button>
          )}
        >
          <span title={`Exact: ${exact(fund.target)}`}>{formatCurrency(fund.target)}</span>
        </Stat>
        <Stat label="Buffer Fulfilled" note={`${percent}% of ${formatCurrency(fund.target)}`}>
          <span title={`Exact: ${exact(fund.saved)}`}>{formatCurrency(fund.saved)}</span> <span className="text-[15px] font-medium text-slate-500">saved</span>
        </Stat>
        <Stat label="Current Safe Runway" note="Months of essentials your savings cover">
          <span className="inline-flex items-center gap-2"><Hourglass size={22} className="text-[#1d4ed8]" aria-hidden="true" /> {fund.runway}</span>
          <span className="ml-2 align-middle rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-800">Safe Margin</span>
        </Stat>
      </dl>

      <Drawer open={showBreakdown} title="How the target is calculated" onClose={onToggleBreakdown}>
            <p className="text-[13px] font-bold uppercase tracking-wide text-slate-600">Trailing Essential Outflows</p>
            <ul className="mt-3 space-y-3">
              {fund.essentials.map((e) => {
                const Icon = essentialIcon(e.name);
                return (
                  <li key={e.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#1d4ed8]"><Icon size={17} aria-hidden="true" /></span>
                    <span>
                      <span className="block text-[15px] text-slate-800">{e.name}</span>
                      <span className="mt-1 block h-1.5 w-full rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[#1d4ed8]/70" style={{ width: `${(e.amount / biggest) * 100}%` }} /></span>
                    </span>
                    <span className="min-w-[5.5rem] text-right text-[15px] font-semibold tabular-nums text-[#0b2545]">{formatCurrency(e.amount)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 text-[15px]">
              <span className="font-medium text-slate-700">Total monthly baseline:</span>
              <span className="font-bold tabular-nums text-[#1d4ed8]">{formatCurrency(fund.monthlyBaseline)} / mo <span className="font-medium text-slate-500">× {buffer} months = {formatCurrency(fund.target)}</span></span>
            </div>
            <p className="mt-2 text-[12px] italic leading-snug text-slate-500">
              *Target floor = {buffer} × the {formatCurrency(fund.monthlyBaseline)}/mo essential baseline (the median of your recent months).
            </p>
      </Drawer>

      <div className="mt-6 flex items-start gap-3 text-[15px] leading-relaxed text-slate-700">
        <CalendarDays size={20} className="mt-0.5 shrink-0 text-[#1d4ed8]" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">Forward Velocity Projection</p>
          {complete ? (
            <p className="font-semibold text-[#0b2545]">Your emergency fund is complete.</p>
          ) : (
            <p>
              At your average surplus of <strong className="tabular-nums text-[#1d4ed8]">{formatCurrency(fund.averageSurplus)}</strong>, you will bridge the remaining{' '}
              {formatCurrency(fund.target - fund.saved)} in approximately <strong className="text-[#0b2545]">{fund.etaRange}</strong> (projected completion:{' '}
              <strong className="text-[#0b2545]">{fund.completion}</strong>).
            </p>
          )}
        </div>
      </div>
    </Chapter>
  );
}
