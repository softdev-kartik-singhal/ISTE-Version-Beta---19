// Goals top row: how funded your goals are, what they need each month, and how many are reachable.
import InfoTip from '../ui/InfoTip';
import { Scale, ShieldCheck, Target, TriangleAlert } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';

export default function GoalSummaryCards({ summary }) {
  const { portfolio, commitment, viability } = summary;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-xl">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1">Your goals <InfoTip text="Funded = total saved across all goals divided by their total targets." /></span>
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
            <span>Total target</span>
            <span className="font-currency-sm text-currency-sm text-on-surface-variant">{formatCurrency(portfolio.target)}</span>
          </div>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1">Needed each month <InfoTip text="For each goal, what is still missing divided by the months left, added up." /></span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-currency-hero text-currency-hero text-on-surface font-semibold tracking-tight">{formatCurrency(commitment.required)}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ month</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-error-container/60 flex items-center justify-center text-error">
            <Scale size={22} />
          </div>
        </div>
        <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-space-md -mb-space-md p-space-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">Usually left over each month <InfoTip text="The middle value of money in minus money out over your recent months." /></span>
            <span className="font-currency-sm text-currency-sm font-semibold text-on-surface">{formatCurrency(commitment.medianSurplus)}/mo</span>
          </div>
          <div className="px-2 py-1 rounded bg-error-container/50 text-on-error-container font-label-sm text-label-sm flex items-center gap-1.5 leading-snug">
            <TriangleAlert size={15} className="shrink-0" />
            <span>Short by {formatCurrency(commitment.required - commitment.medianSurplus)}/mo: pick what matters most or move some dates later</span>
          </div>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1">Goals you can reach <InfoTip text="Goals whose monthly need fits inside what you usually have left over, after the emergency fund." /></span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-headline-lg text-on-surface">
                {viability.solvent} of {viability.total}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">on track</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
            <ShieldCheck size={22} />
          </div>
        </div>
        <div className="mt-4 pt-3 bg-surface-container-low/60 -mx-space-md -mb-space-md p-space-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>Emergency fund</span>
            <span className="font-currency-sm text-currency-sm font-semibold text-primary">{viability.bufferStatus}</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
            Every plan keeps your {formatCurrency(viability.emergencyFloor)} emergency fund untouched.
          </p>
        </div>
      </div>
    </div>
  );
}
