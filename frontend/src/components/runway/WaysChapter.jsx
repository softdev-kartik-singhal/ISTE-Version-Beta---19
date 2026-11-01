// Chapter 03, Step 2: put the extra to work. A fixed deposit and a recurring deposit as "growth tubes": the fill is the money
// you put in, and the extra you earn rises as a highlighted top segment. The FD has a faint ghost tube for what a plain savings
// account would earn. The example rates are labelled steppers; the numbers count up when they change. Insurance is a shield panel.
// Every figure comes from /api/ways-to-use-money (the user's own cash, leftover and spending); nothing here is an offer.
import { useEffect, useState } from 'react';
import { CircleCheck, CircleAlert, HeartPulse, Landmark, Minus, PiggyBank, Plus, Shield, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import Chapter from './Chapter';
import { useApi } from '../../hooks/useApi';
import { useCountUp } from '../../hooks/useMotion';
import { getWaysToUseMoney } from '../../services/api';
import { exact, shortRupees } from '../../utils/money';

const money = (n) => shortRupees(n);
const TUBE_H = 230; // px

// Debounces the typed rate so the server is asked once the user stops typing.
function useRate() {
  const [typed, setTyped] = useState('');
  const [applied, setApplied] = useState(null);
  useEffect(() => {
    if (typed === '') return undefined;
    const t = setTimeout(() => setApplied(Math.min(15, Math.max(0, Number(typed) || 0))), 400);
    return () => clearTimeout(t);
  }, [typed]);
  return [typed, setTyped, applied];
}

// A labelled "- 7 % a year +" stepper.
function RateStepper({ id, label, value, onChange }) {
  const num = Number(value) || 0;
  const set = (n) => onChange(String(Math.round(Math.min(15, Math.max(0, n)) * 10) / 10));
  const btn = 'flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1d4ed8]/25';
  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-slate-600">{label}</label>
      <button type="button" className={btn} aria-label={`Lower the ${label.toLowerCase()}`} onClick={() => set(num - 0.5)}><Minus size={15} aria-hidden="true" /></button>
      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[14px] font-bold text-[#0b2545]">
        <input id={id} type="number" min="0" max="15" step="0.1" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="w-11 bg-transparent text-right focus:outline-none" />
        <span className="font-medium text-slate-500">% a year</span>
      </span>
      <button type="button" className={btn} aria-label={`Raise the ${label.toLowerCase()}`} onClick={() => set(num + 0.5)}><Plus size={15} aria-hidden="true" /></button>
    </div>
  );
}

// One tube. `base` + `gain` are rupees measured against `scale` (the biggest total on this chapter, so tubes compare fairly).
function Tube({ label, base, gain, scale, ghost = false }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setOn(true)); // start empty, then fill
    return () => cancelAnimationFrame(frame);
  }, []);
  const basePct = scale > 0 ? (base / scale) * 100 : 0;
  const gainPct = gain > 0 ? Math.max(4, (gain / scale) * 100) : 0; // the extra is always visible
  const fillStyle = (pct, bottom, delay) => ({ bottom: `${bottom}%`, height: `${pct}%`, transform: `scaleY(${on ? 1 : 0})`, transformOrigin: 'bottom', transitionDelay: delay });
  return (
    <div className={`flex flex-col items-center gap-2 ${ghost ? 'opacity-55' : ''}`}>
      <div className="relative w-[72px] overflow-hidden rounded-b-[36px] rounded-t-xl border-2 border-slate-300 bg-slate-100" style={{ height: TUBE_H }} role="img" aria-label={`${label}: ${money(base)} in${gain ? `, ${money(gain)} extra` : ''}`}>
        <div className="tube-fill absolute inset-x-0 bg-gradient-to-t from-[#1d4ed8] to-[#60a5fa]" style={fillStyle(basePct, 0, '0ms')} />
        {gain > 0 && <div className="tube-fill absolute inset-x-0 bg-gradient-to-t from-emerald-500 to-emerald-300" style={fillStyle(gainPct, basePct, '180ms')} />}
        <span className="pointer-events-none absolute inset-y-3 left-2 w-1.5 rounded-full bg-white/50" aria-hidden="true" />
      </div>
      <span className="text-center text-[12px] font-semibold leading-tight text-slate-600">{label}</span>
    </div>
  );
}

function Rows({ rows }) {
  return (
    <dl className="divide-y divide-slate-200">
      {rows.map(({ label, value, title, strong }) => (
        <div key={label} className="flex items-baseline justify-between gap-3 py-2">
          <dt className="text-[14px] text-slate-600">{label}</dt>
          <dd className={`whitespace-nowrap text-[15px] tabular-nums ${strong ? 'font-bold text-emerald-700' : 'font-semibold text-[#0b2545]'}`} title={title}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Calculator({ icon: Icon, title, tag, hero, caption, tubes, rows, stepper, note }) {
  const shown = useCountUp(hero, true, 700);
  return (
    <div className="py-2 lg:px-8 lg:first:pl-0 lg:last:pr-0">
      <h3 className="flex items-center gap-2.5 text-[20px] font-bold text-[#0b2545]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1d4ed8]"><Icon size={19} aria-hidden="true" /></span>
        {title} <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-medium text-slate-600">{tag}</span>
      </h3>
      <div className="mt-5 flex items-end gap-5">
        <div className="flex items-end gap-3">{tubes}</div>
        <div className="min-w-0 flex-1 pb-1">
          <p className="text-[36px] font-extrabold leading-none tracking-tight text-emerald-700 tabular-nums" title={`Exact: ${exact(hero)}`}>+{money(shown)}</p>
          <p className="mt-1 text-[13px] text-slate-600">{caption}</p>
        </div>
      </div>
      <div className="mt-5"><Rows rows={rows} /></div>
      <div className="mt-4">{stepper}</div>
      {note && <p className="mt-3 text-[13px] text-slate-600">{note}</p>}
    </div>
  );
}

function Cover({ found, icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${found ? 'bg-emerald-50' : 'bg-amber-50'}`}>
        {found ? <ShieldCheck size={28} className="text-emerald-700" fill="#a7f3d0" aria-hidden="true" /> : <ShieldAlert size={28} className="text-amber-700" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[17px] font-bold text-[#0b2545]"><Icon size={18} className="text-slate-500" aria-hidden="true" /> {title}</p>
          {found
            ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-bold text-emerald-800"><CircleCheck size={15} aria-hidden="true" /> Found</span>
            : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[13px] font-bold text-amber-800"><CircleAlert size={15} aria-hidden="true" /> Not found</span>}
        </div>
        <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{children}</p>
      </div>
    </div>
  );
}

export default function WaysChapter() {
  const [fdTyped, setFdTyped, fdRate] = useRate();
  const [rdTyped, setRdTyped, rdRate] = useRate();
  const api = useApi(() => getWaysToUseMoney(fdRate, rdRate), [fdRate, rdRate]);
  if (!api.ready) return null; // an extra chapter: nothing to show until there is data

  const { base, fd, rd, policy, rates } = api.data;
  const scale = Math.max(fd.amount + fd.interest, fd.amount + fd.idleInterest, rd.deposited + rd.interest, 1);

  return (
    <Chapter n="03" id="put-to-work" tag="Step 2" title="Put the extra to work">
      <div className="-mt-3 mb-8 flex flex-wrap gap-3">
        {base.funded ? (
          <>
            <span className="rounded-full bg-white px-4 py-2 text-[15px] text-slate-700 shadow-sm ring-1 ring-slate-200"><strong className="text-[#0b2545]" title={exact(base.spare)}>{money(base.spare)}</strong> above your safety net</span>
            <span className="rounded-full bg-white px-4 py-2 text-[15px] text-slate-700 shadow-sm ring-1 ring-slate-200"><strong className="text-[#0b2545]" title={exact(base.leftover)}>{money(base.leftover)}</strong> usually left each month</span>
          </>
        ) : (
          <span className="rounded-full bg-amber-50 px-4 py-2 text-[15px] text-amber-900 ring-1 ring-amber-200">Fill your safety net first: <strong title={exact(base.shortfall)}>{money(base.shortfall)}</strong> to go. After that, extra money can work harder.</span>
        )}
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0 [&>div]:py-8">
        <Calculator
          icon={Landmark} title="Fixed deposit" tag="Lump sum" hero={fd.interest} caption="interest in a year"
          tubes={fd.amount > 0 ? (
            <>
              <Tube label="Fixed deposit" base={fd.amount} gain={fd.interest} scale={scale} />
              <Tube label="Savings account" base={fd.amount} gain={fd.idleInterest} scale={scale} ghost />
            </>
          ) : null}
          rows={fd.amount > 0 ? [
            { label: 'You put in', value: money(fd.amount), title: `${exact(fd.amount)}: the cash above your safety net` },
            { label: 'Savings account instead', value: money(fd.idleInterest), title: exact(fd.idleInterest) },
            { label: 'Extra you earn', value: `+${money(fd.extra)}`, title: exact(fd.extra), strong: true },
          ] : []}
          stepper={<RateStepper id="fd-rate" label="Example rate" value={fdTyped === '' ? rates.fd : fdTyped} onChange={setFdTyped} />}
          note={fd.amount > 0 ? null : 'Nothing to put away yet: your safety net comes first and should stay easy to reach.'}
        />
        <Calculator
          icon={PiggyBank} title="Recurring deposit" tag="Monthly" hero={rd.interest} caption={`interest over ${rd.months} months`}
          tubes={rd.monthly > 0 ? <Tube label="Recurring deposit" base={rd.deposited} gain={rd.interest} scale={scale} /> : null}
          rows={rd.monthly > 0 ? [
            { label: `Each month (${rd.sharePct}% of your usual leftover)`, value: money(rd.monthly), title: exact(rd.monthly) },
            { label: 'You deposit', value: money(rd.deposited), title: exact(rd.deposited) },
            { label: 'You get back', value: money(rd.total), title: exact(rd.total), strong: true },
          ] : []}
          stepper={<RateStepper id="rd-rate" label="Example rate" value={rdTyped === '' ? rates.rd : rdTyped} onChange={setRdTyped} />}
          note={rd.monthly > 0 ? (rd.fillsNetInMonths != null ? `That would also fill your safety net in about ${rd.fillsNetInMonths} month${rd.fillsNetInMonths === 1 ? '' : 's'}.` : null) : 'You have no usual monthly leftover to set aside right now.'}
        />
      </div>

      <p className="mt-4 text-[13px] text-slate-600">Example rates and amounts, not offers. Check current rates and terms before you decide.</p>

      <div className="mt-10">
        <h3 className="flex items-center gap-2.5 text-[20px] font-bold text-[#0b2545]"><Shield size={21} className="text-[#1d4ed8]" aria-hidden="true" /> Insurance <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-medium text-slate-600">Protection</span></h3>
        <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
          <Cover found={policy.hasLife} icon={Users} title="Life cover">
            {policy.hasLife
              ? 'A life insurance premium shows in your payments.'
              : <>No life insurance premium shows in your payments. If anyone depends on your income, a common rule of thumb is cover worth about {policy.coverYears} years of your essential spending: <strong className="text-[#0b2545]" title={exact(policy.lifeCover)}>{money(policy.lifeCover)}</strong>.</>}
          </Cover>
          <Cover found={policy.hasHealth} icon={HeartPulse} title="Health cover">
            {policy.hasHealth
              ? 'A health insurance premium shows in your payments.'
              : <>No health insurance premium shows either. A {money(policy.exampleBill)} hospital bill would use {policy.billShare != null ? `${policy.billShare}% of` : 'a large part of'} your savings.</>}
          </Cover>
        </div>
        <p className="mt-3 text-[13px] text-slate-600">Doesn&apos;t earn interest. It protects your savings from a big shock.</p>
      </div>
    </Chapter>
  );
}
