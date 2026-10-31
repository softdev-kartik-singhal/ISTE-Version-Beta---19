// Ask "Annual Bonus Intelligence Note" card with the simulate-with-bonus action.
import { ArrowRight, PartyPopper } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function BonusNote({ bonus, included, onToggle }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
      <div className="flex items-start gap-space-md">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <PartyPopper size={26} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase font-semibold text-amber-800 tracking-wider bg-amber-50 px-2 py-0.5 rounded">
              Historical Income Pattern Detected
            </span>
            <span className="font-label-sm text-label-sm text-secondary">• HDFC Payroll Tag</span>
          </div>
          <h4 className="font-headline-sm text-headline-sm text-on-surface">Annual Bonus Intelligence Note</h4>
          <p className="font-body-md text-body-md text-secondary max-w-3xl">
            Your annual corporate bonus from last year (
            <span className="font-currency-sm font-semibold text-on-surface">{formatCurrency(bonus.lastAmount)}</span> in {bonus.lastMonth})
            hasn&apos;t arrived this cycle yet, so it is left out of your usual income. If it arrives:{' '}
            <strong>Yes — you will unlock an additional {formatCurrency(bonus.unlockedSurplus)}+ surplus across all scenarios.</strong>
          </p>
        </div>
      </div>
      <button
        className="shrink-0 px-space-md py-2.5 rounded-lg bg-surface hover:bg-surface-container-low text-primary font-label-md text-label-md font-semibold transition-all flex items-center gap-2 shadow-sm"
        onClick={onToggle}
      >
        <span>{included ? 'Remove bonus from simulation' : 'Simulate with bonus included'}</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
