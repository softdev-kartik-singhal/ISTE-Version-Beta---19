// Flag card for an unusually large spend, showing its impact on this month's safe ceiling.
import { Armchair, BadgeCheck, Calendar, CalendarClock, ChartLine, Check, Columns2, CreditCard, TrendingUp } from 'lucide-react';
import FlagCardShell from './FlagCardShell';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';

export default function LargeSpendFlagCard({ flag, dimmed, onResolve }) {
  const amount = formatCurrency(flag.amount, { decimals: 2 });
  return (
    <FlagCardShell
      dimmed={dimmed}
      accentClass="bg-primary-container"
      badge={{ icon: <TrendingUp size={16} className="text-blue-700" />, label: 'Unusually large spend', className: 'bg-blue-50 text-blue-800' }}
      source={flag.source}
      tag={{ label: 'Budget Impact', className: 'bg-surface-container-high text-primary font-semibold' }}
      reasonIcon={<ChartLine size={20} className="text-primary shrink-0 mt-0.5" />}
      reason={
        <>
          <span className="font-currency-sm font-semibold text-primary">{amount}</span> is{' '}
          <span className="font-semibold text-error">{flag.multiple}</span> (typical category monthly average:{' '}
          {formatCurrency(flag.typicalAverage, { decimals: 2 })}).
        </>
      }
      actions={
        <>
          <button onClick={() => onResolve('Marked as a planned purchase')} className="px-3.5 py-2 rounded-lg bg-primary-container text-white font-label-md text-label-md font-semibold hover:bg-primary transition-all flex items-center gap-1.5 shadow-sm">
            <Check size={18} /> Looks fine (Planned purchase)
          </button>
          <button onClick={() => onResolve('Reclassified as one-time capital expense')} className="px-3.5 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-medium hover:bg-surface-container hover:text-primary transition-all flex items-center gap-1">
            <CalendarClock size={16} /> Reclassify as One-time Capital
          </button>
          <button onClick={() => onResolve('Amortized over a 3-month EMI')} className="px-3.5 py-2 rounded-lg bg-surface-container-low text-secondary font-label-md text-label-md font-medium hover:bg-surface-container hover:text-on-surface transition-all flex items-center gap-1">
            <Columns2 size={16} /> Split to 3-month EMI amortize
          </button>
        </>
      }
      aside={<button onClick={() => onResolve('Kept out of the Shopping average')} className="px-3 py-1.5 text-secondary hover:text-on-surface font-label-sm text-label-sm">Keep Shopping average unchanged</button>}
    >
      <div className="lg:col-span-5 flex items-start gap-space-sm">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <Armchair size={26} />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{flag.merchant}</h2>
          <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
            <CreditCard size={15} />
            <span>{flag.account}</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm pt-1">
            <Calendar size={14} />
            <span>{flag.time}</span>
            <span className="text-outline-variant">•</span>
            <span>{flag.category}</span>
          </div>
        </div>
      </div>
      <div className="lg:col-span-7 bg-surface-container-low rounded-lg p-space-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Affordability &amp; Runway Impact</span>
          <span className="font-currency-md text-currency-md font-semibold text-on-surface">
            {amount} <span className="text-label-sm text-secondary">DR</span>
          </span>
        </div>
        <div className="space-y-1.5 my-1">
          <div className="flex items-center justify-between text-label-sm font-label-sm">
            <span className="text-secondary">October Safe Ceiling Remaining</span>
            <span className="font-currency-sm font-medium text-primary">
              {formatCurrency(flag.ceilingRemaining)} (Reduced from {formatCurrency(flag.ceilingBefore)})
            </span>
          </div>
          <ProgressBar percent={flag.ceilingPercent} barClass="bg-primary-container" heightClass="h-2" />
        </div>
        <p className="font-label-sm text-label-sm text-secondary flex items-center gap-1 pt-1">
          <BadgeCheck size={15} className="text-emerald-600" /> {flag.note}
        </p>
      </div>
    </FlagCardShell>
  );
}
