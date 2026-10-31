// Goals KPI row: portfolio funding, monthly commitment vs surplus, and milestone viability.
import { CircleCheck, Info, Scale, ShieldCheck, Target, TriangleAlert } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';

export default function GoalSummaryCards({ summary }) {
  const { portfolio, commitment, viability } = summary;
  return (
    <div data-tour="plan-goals" className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-xl">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Active Goals Portfolio</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-headline-lg text-on-surface">{portfolio.count} Goals</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                {portfolio.fundedPercent}% Funded
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
            <Target size={22} />
          </div>
        </div>
        <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-space-md -mb-space-md p-space-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>Total Saved</span>
            <span className="font-currency-sm text-currency-sm font-semibold text-on-surface">{formatCurrency(portfolio.saved)}</span>
          </div>
          <ProgressBar percent={portfolio.fundedPercent} trackClass="bg-surface-container-high" heightClass="h-2" />
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>Total Target Objective</span>
            <span className="font-currency-sm text-currency-sm text-on-surface-variant">{formatCurrency(portfolio.target)}</span>
          </div>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Monthly Commitment</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-currency-hero text-currency-hero text-on-surface font-semibold tracking-tight">{formatCurrency(commitment.required)}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ month required</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-error-container/60 flex items-center justify-center text-error">
            <Scale size={22} />
          </div>
        </div>
        <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-space-md -mb-space-md p-space-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>Trailing Median Surplus</span>
            <span className="font-currency-sm text-currency-sm font-semibold text-on-surface">{formatCurrency(commitment.medianSurplus)}/mo</span>
          </div>
          {/* shortfall = needed − surplus, shown only when needed is bigger; covered-by-savings is not a deficit */}
          {commitment.shortfall > 0 && !commitment.allOnTrack && (
            <div className="px-2 py-1 rounded bg-error-container/50 text-on-error-container font-label-sm text-label-sm flex items-center gap-1.5 leading-snug">
              <TriangleAlert size={15} className="shrink-0" />
              <span>Deficit of {formatCurrency(commitment.shortfall)}/mo — prioritize or extend milestones</span>
            </div>
          )}
          {commitment.shortfall > 0 && commitment.allOnTrack && (
            <div className="px-2 py-1 rounded bg-amber-100 text-amber-900 font-label-sm text-label-sm flex items-center gap-1.5 leading-snug">
              <Info size={15} className="shrink-0" />
              <span>Needs {formatCurrency(commitment.shortfall)}/mo more than your usual surplus; your current savings cover the gap</span>
            </div>
          )}
          {commitment.shortfall === 0 && (
            <div className="px-2 py-1 rounded bg-emerald-100 text-emerald-900 font-label-sm text-label-sm flex items-center gap-1.5 leading-snug">
              <CircleCheck size={15} className="shrink-0" />
              <span>Covered: {formatCurrency(commitment.spare)}/mo to spare</span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Milestone Viability</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-headline-lg text-on-surface">
                {viability.solvent} of {viability.total}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">Fully Solvent</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
            <ShieldCheck size={22} />
          </div>
        </div>
        <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-space-md -mb-space-md p-space-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>Baseline Emergency Buffer</span>
            <span className="font-currency-sm text-currency-sm font-semibold text-primary">{viability.bufferStatus}</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
            Calculations protect your {formatCurrency(viability.emergencyFloor)} emergency liquid floor without compromise.
          </p>
        </div>
      </div>
    </div>
  );
}
