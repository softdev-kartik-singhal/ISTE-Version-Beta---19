// Surplus Plan Step 3: split the usual monthly surplus between emergency buffer and long-term goals.
import { useState } from 'react';
import { ArrowRight, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const PRESET_ACTIVE = 'px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md transition-colors';
const PRESET_IDLE = 'px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors';

export default function AllocationSimulator({ allocation, committed, onExport, onCommit }) {
  const [emergencyPct, setEmergencyPct] = useState(allocation.defaultSplit);
  const goalsPct = 100 - emergencyPct;
  const emergencyAmt = Math.round((allocation.monthlySurplus * emergencyPct) / 100);
  const goalsAmt = Math.round((allocation.monthlySurplus * goalsPct) / 100);
  const complete = allocation.remainingEmergency <= 0; // never a negative remaining amount or "~0.0 months"
  const eta = complete ? 'Complete' : emergencyAmt <= 0 ? 'Paused (Indefinite)' : `~${Math.max(1, Math.ceil(allocation.remainingEmergency / emergencyAmt))} months`;

  return (
    <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="px-2.5 py-1 rounded-full bg-primary-container text-surface-container-lowest font-label-md text-label-md uppercase tracking-wider">Step 3</span>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Simulate how your usual monthly surplus is split</h2>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Available Monthly Surplus:</span>
          <span className="font-currency-md text-currency-md font-bold text-primary">{formatCurrency(allocation.monthlySurplus)}</span>
          <span className="font-label-sm text-[10px] text-outline"></span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium mr-1">Recommended Presets:</span>
        {allocation.presets.map((p) => (
          <button key={p.split} type="button" className={p.split === emergencyPct ? PRESET_ACTIVE : PRESET_IDLE} onClick={() => setEmergencyPct(p.split)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-space-md p-space-md bg-surface-container-low rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-container" />
            <span className="font-body-sm text-body-sm font-semibold text-on-surface">Emergency Buffer: {emergencyPct}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary" />
            <span className="font-body-sm text-body-sm font-semibold text-on-surface">Long-term Goals: {goalsPct}%</span>
          </div>
        </div>
        <div className="relative py-2">
          <input
            className="w-full h-3 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            max="100"
            min="0"
            step="5"
            type="range"
            value={emergencyPct}
            onChange={(e) => setEmergencyPct(parseInt(e.target.value, 10))}
          />
          <div className="flex justify-between font-label-sm text-[11px] text-on-surface-variant mt-2">
            <span>0% Emergency / 100% Growth</span>
            <span>Balanced 50 / 50</span>
            <span>100% Emergency / 0% Growth</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md">
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold uppercase">Bucket 1 • Safety Buffer</span>
              <Shield size={20} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant">Emergency Fund Allocation</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-currency-hero text-currency-hero text-on-surface font-bold">{formatCurrency(emergencyAmt)}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">/ month</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Target destination: High-yield liquid savings or overnight sweep deposit.</p>
          </div>
          <div className="p-3 bg-surface-container-lowest rounded-lg flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              {complete ? 'Your emergency fund is complete' : `New ETA to full ${allocation.targetLabel} target:`}
            </span>
            <span className="font-currency-sm text-currency-sm font-semibold text-primary">{eta}</span>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md">
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-on-secondary-container font-semibold uppercase">
                Bucket 2 • Compounding
              </span>
              <TrendingUp size={20} className="text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant">Long-term Goals &amp; Deployments</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-currency-hero text-currency-hero text-on-surface font-bold">{formatCurrency(goalsAmt)}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">/ month</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Deployable across preferred Step 2 asset classes (PPF, Index SIPs, or Debt Funds).</p>
          </div>
          <div className="p-3 bg-surface-container-lowest rounded-lg flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Annualized Deployable Power:</span>
            <span className="font-currency-sm text-currency-sm font-semibold text-on-surface">{formatCurrency(goalsAmt * 12)} / year</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-sm">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
          <RefreshCw size={16} className="text-primary" />
          <span>Simulation saves automatically to your personal local profile.</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="w-full sm:w-auto px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm" type="button" onClick={() => onExport({ emergencyPct, emergencyAmt, goalsPct, goalsAmt, eta })}>
            Export Allocation Plan
          </button>
          <button className="w-full sm:w-auto px-5 py-2 rounded-lg bg-primary-container text-surface-container-lowest font-body-sm text-body-sm font-semibold hover:bg-primary transition-colors shadow-sm flex items-center justify-center gap-1.5" type="button" onClick={() => onCommit({ emergencyPct, emergencyAmt, goalsAmt })}>
            <span>{committed ? 'Committed ✓ (click to undo)' : 'Commit to Next Month'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
