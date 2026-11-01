// Chapter 04, Step 3: split the usual monthly surplus between the emergency buffer and long-term goals.
// The surplus is a stream that splits into two channels; the slider and presets set the widths. The split is remembered on
// this device. If the emergency fund is already complete the split starts at 100% goals (presets still work).
import { useEffect, useState } from 'react';
import { ArrowRight, Check, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import Chapter from './Chapter';
import Stream from './Stream';
import { formatCurrency } from '../../utils/formatCurrency';

const KEY = 'sg_surplus_split';

function readSplit() {
  try {
    const v = Number(localStorage.getItem(KEY));
    return localStorage.getItem(KEY) !== null && v >= 0 && v <= 100 ? v : null;
  } catch {
    return null;
  }
}

function Channel({ tone, icon: Icon, badge, title, amount, pct, children, footer }) {
  const dot = tone === 'blue' ? 'bg-[#1d4ed8]' : 'bg-[#0891b2]';
  return (
    <div className="flex flex-col gap-3 border-l-[3px] pl-5" style={{ borderColor: tone === 'blue' ? '#1d4ed8' : '#0891b2' }}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" /> {badge}</span>
        <Icon size={20} className={tone === 'blue' ? 'text-[#1d4ed8]' : 'text-[#0891b2]'} aria-hidden="true" />
      </div>
      <div>
        <p className="text-[14px] text-slate-600">{title}</p>
        <p className="mt-0.5 text-[30px] font-extrabold leading-tight tracking-tight text-[#0b2545] tabular-nums">{formatCurrency(amount)} <span className="text-[16px] font-medium text-slate-500">/ month</span> <span className="ml-1 text-[15px] font-semibold text-slate-500">{pct}%</span></p>
      </div>
      <p className="text-[14px] leading-relaxed text-slate-600">{children}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-[14px]">{footer}</div>
    </div>
  );
}

export default function SplitChapter({ allocation, committed, onExport, onCommit }) {
  const complete = allocation.remainingEmergency <= 0; // never a negative remaining amount or "~0.0 months"
  const [emergencyPct, setEmergencyPct] = useState(() => readSplit() ?? (complete ? 0 : allocation.defaultSplit));
  useEffect(() => { // "saves automatically": remembered on this device
    try { localStorage.setItem(KEY, String(emergencyPct)); } catch { /* storage unavailable: the split just is not remembered */ }
  }, [emergencyPct]);

  const goalsPct = 100 - emergencyPct;
  const emergencyAmt = Math.round((allocation.monthlySurplus * emergencyPct) / 100);
  const goalsAmt = Math.round((allocation.monthlySurplus * goalsPct) / 100);
  const eta = complete ? 'Complete' : emergencyAmt <= 0 ? 'Paused (Indefinite)' : `~${Math.max(1, Math.ceil(allocation.remainingEmergency / emergencyAmt))} months`;
  const plan = { emergencyPct, emergencyAmt, goalsPct, goalsAmt, eta };
  const same = committed && committed.emergencyPct === emergencyPct;

  return (
    <Chapter
      n="04" id="split" tag="Step 3" title="Split your monthly surplus"
      aside={(
        <p className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[14px] shadow-sm ring-1 ring-slate-200">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Available Monthly Surplus:</span>
          <strong className="text-[18px] tabular-nums text-[#1d4ed8]">{formatCurrency(allocation.monthlySurplus)}</strong>
        </p>
      )}
    >
      <p className="-mt-4 mb-7 max-w-2xl text-[16px] text-slate-600">Simulate how your usual monthly surplus is split.</p>
      <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Recommended presets">
        <span className="mr-1 text-[14px] font-medium text-slate-600">Recommended Presets:</span>
        {allocation.presets.map((p) => (
          <button key={p.split} type="button" aria-pressed={p.split === emergencyPct} onClick={() => setEmergencyPct(p.split)}
            className={`h-10 rounded-full px-4 text-[14px] font-semibold transition-colors ${p.split === emergencyPct ? 'bg-[#1d4ed8] text-white' : 'border border-slate-300 bg-white text-slate-800 hover:border-[#1d4ed8]/50'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
        <Stream topPct={emergencyPct} bottomPct={goalsPct} complete={complete} />
        <div className="grid grid-cols-1 gap-8 max-md:grid-cols-1">
          <Channel
            tone="blue" icon={Shield} badge="Bucket 1 • Safety Buffer" title="Emergency Fund Allocation" amount={emergencyAmt} pct={emergencyPct}
            footer={(
              <>
                <span className="font-medium text-slate-600">{complete ? 'Your emergency fund is complete' : `New ETA to full ${allocation.targetLabel} target:`}</span>
                <span className={`flex items-center gap-1.5 font-bold ${complete ? 'text-emerald-800' : 'text-[#1d4ed8]'}`}>{complete && <Check size={16} strokeWidth={3} aria-hidden="true" />}{eta}</span>
              </>
            )}
          >
            Target destination: High-yield liquid savings or overnight sweep deposit.
          </Channel>
          <Channel
            tone="cyan" icon={TrendingUp} badge="Bucket 2 • Compounding" title="Long-term Goals & Deployments" amount={goalsAmt} pct={goalsPct}
            footer={(
              <>
                <span className="font-medium text-slate-600">Annualized Deployable Power:</span>
                <span className="font-bold tabular-nums text-[#0b2545]">{formatCurrency(goalsAmt * 12)} / year</span>
              </>
            )}
          >
            Deployable across preferred Step 2 asset classes (PPF, Index SIPs, or Debt Funds).
          </Channel>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-[#0b2545]"><span className="h-3 w-3 rounded-full bg-[#1d4ed8]" aria-hidden="true" /> Emergency Buffer: {emergencyPct}%</p>
          <p className="flex items-center gap-2 text-[15px] font-semibold text-[#0b2545]"><span className="h-3 w-3 rounded-full bg-[#0891b2]" aria-hidden="true" /> Long-term Goals: {goalsPct}%</p>
        </div>
        <input
          aria-label="Share of your monthly surplus for the emergency buffer" className="mt-4 h-3 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#1d4ed8] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1d4ed8]/25"
          type="range" min="0" max="100" step="5" value={emergencyPct} onChange={(e) => setEmergencyPct(parseInt(e.target.value, 10))}
        />
        <div className="mt-3 grid grid-cols-3 gap-3 text-[12px] leading-snug text-slate-600">
          <span className="text-left">0% Emergency / 100% Growth</span>
          <span className="text-center">Balanced 50 / 50</span>
          <span className="text-right">100% Emergency / 0% Growth</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-[14px] text-slate-600"><RefreshCw size={16} className="shrink-0 text-[#1d4ed8]" aria-hidden="true" /> Simulation saves automatically to your personal local profile.</p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button type="button" onClick={() => onExport(plan)} className="h-11 rounded-full border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-800 hover:bg-slate-50">Export Allocation Plan</button>
          <button type="button" onClick={() => onCommit(plan)} className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#1d4ed8] px-6 text-[15px] font-semibold text-white hover:bg-[#1e40af]">
            <span>{same ? 'Committed ✓ (click to undo)' : committed ? 'Update commitment for next month' : 'Commit to Next Month'}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      {committed && (
        <p className="mt-3 text-[14px] text-emerald-800" role="status">
          Committed for {committed.month}: {formatCurrency(committed.emergencyAmt)} to the emergency buffer and {formatCurrency(committed.goalsAmt)} to goals.
        </p>
      )}
    </Chapter>
  );
}
