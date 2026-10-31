// Flag card for a possible duplicate debit, comparing the original and suspected twin transaction.
import { CircleCheck, Clock, Copy, CreditCard, EyeOff, Gavel, Info, Store, Tag, TriangleAlert } from 'lucide-react';
import FlagCardShell from './FlagCardShell';
import { formatCurrency } from '../../utils/formatCurrency';

export default function DuplicateFlagCard({ flag, dimmed, onResolve, onChangeCategory }) {
  const amount = formatCurrency(flag.amount, { decimals: 2 });
  return (
    <FlagCardShell
      dimmed={dimmed}
      accentClass="bg-tertiary-container"
      badge={{ icon: <Copy size={16} className="text-amber-700" />, label: 'Possible duplicate', className: 'bg-amber-50 text-amber-800' }}
      source={flag.source}
      tag={{ label: 'Urgent Attention', className: 'bg-error-container text-on-error-container font-semibold' }}
      reasonIcon={<Info size={20} className="text-tertiary shrink-0 mt-0.5" />}
      reason={
        <>
          Same merchant and amount <span className="font-currency-sm font-semibold text-on-surface">{amount}</span> debited within{' '}
          {flag.gapText} on {flag.bankName}.
        </>
      }
      actions={
        <>
          <button onClick={() => onResolve('Confirmed as a duplicate charge')} className="px-3.5 py-2 rounded-lg bg-tertiary-container text-white font-label-md text-label-md font-semibold hover:bg-tertiary transition-all flex items-center gap-1.5 shadow-sm">
            <Gavel size={18} /> Dispute / Report Double Debit
          </button>
          <button onClick={() => onResolve('Reviewed as 2 separate orders')} className="px-3.5 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-medium hover:bg-surface-container hover:text-primary transition-all">
            Not a duplicate (2 separate orders)
          </button>
          <button onClick={onChangeCategory} className="px-3.5 py-2 rounded-lg bg-surface-container-low text-secondary font-label-md text-label-md font-medium hover:bg-surface-container hover:text-on-surface transition-all flex items-center gap-1">
            <Tag size={16} /> Change category
          </button>
        </>
      }
      aside={
        <button onClick={() => onResolve('Dismissed without changes')} className="px-3 py-1.5 text-secondary hover:text-on-surface font-label-md text-label-md flex items-center justify-center gap-1">
          <EyeOff size={16} /> Dismiss
        </button>
      }
    >
      <div className="lg:col-span-5 flex items-start gap-space-sm">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
          <Store size={26} />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{flag.merchant}</h2>
          <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
            <CreditCard size={15} />
            <span>{flag.account}</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm pt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary" />
            <span>{flag.category}</span>
            <span className="text-outline-variant">•</span>
            <span>{flag.orderRef}</span>
          </div>
        </div>
      </div>
      <div className="lg:col-span-7 bg-surface-container-low rounded-lg p-space-sm space-y-space-xs">
        <div className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Timeline Comparison of Twin Debits</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xs">
          <div className="p-2.5 rounded-md bg-surface-container-lowest shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm text-secondary">Original Txn #1</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-sm text-label-sm font-semibold flex items-center gap-0.5">
                <CircleCheck size={12} /> Settled
              </span>
            </div>
            <div className="font-currency-md text-currency-md font-semibold text-on-surface">
              {amount} <span className="text-label-sm text-secondary">DR</span>
            </div>
            <div className="font-label-sm text-label-sm text-secondary mt-1 flex items-center gap-1">
              <Clock size={14} /> {flag.originalTime}
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-tertiary-fixed/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm text-tertiary font-semibold">Flagged Duplicate #2</span>
              <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-white font-label-sm text-label-sm font-semibold flex items-center gap-0.5">
                <TriangleAlert size={12} /> Potential Ghost
              </span>
            </div>
            <div className="font-currency-md text-currency-md font-semibold text-tertiary">
              {amount} <span className="text-label-sm text-tertiary">DR</span>
            </div>
            <div className="font-label-sm text-label-sm text-tertiary mt-1 flex items-center gap-1">
              <Clock size={14} /> {flag.duplicateTime}
            </div>
          </div>
        </div>
      </div>
    </FlagCardShell>
  );
}
