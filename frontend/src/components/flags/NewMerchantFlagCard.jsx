// Flag card for a first-time merchant, with the recurring-subscription detection toggle.
import { useState } from 'react';
import { BadgeAlert, Check, Clock, Pencil, ReceiptText, Repeat, Sparkles, Terminal, Wallet } from 'lucide-react';
import FlagCardShell from './FlagCardShell';
import { formatCurrency } from '../../utils/formatCurrency';

export default function NewMerchantFlagCard({ flag, dimmed, onResolve, onChangeCategory }) {
  const [detectRecurring, setDetectRecurring] = useState(true);
  return (
    <FlagCardShell
      dimmed={dimmed}
      accentClass="bg-secondary"
      badge={{ icon: <BadgeAlert size={16} className="text-slate-700" />, label: 'New merchant', className: 'bg-slate-100 text-slate-800' }}
      source={flag.source}
      tag={{ label: 'Recurring Subscription Candidate', className: 'bg-surface-container text-secondary' }}
      reasonIcon={<Sparkles size={20} className="text-secondary shrink-0 mt-0.5" />}
      reason={
        <>
          First time transacting with <strong className="text-on-surface font-semibold">‘{flag.descriptor}’</strong>. Auto-assigned to{' '}
          <span className="font-semibold text-primary">{flag.category}</span>.
        </>
      }
      actions={
        <>
          <button onClick={() => onResolve('Added to Subscriptions')} className="px-3.5 py-2 rounded-lg bg-primary-container text-white font-label-md text-label-md font-semibold hover:bg-primary transition-all flex items-center gap-1.5 shadow-sm">
            <Check size={18} /> Looks fine &amp; add to Subscriptions
          </button>
          <button onClick={onChangeCategory} className="px-3.5 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-medium hover:bg-surface-container hover:text-primary transition-all flex items-center gap-1">
            <Pencil size={16} /> Change category
          </button>
          <button onClick={() => onResolve('Tagged as freelance tax deductible (44ADA)')} className="px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-800 font-label-md text-label-md font-medium hover:bg-emerald-100 transition-all flex items-center gap-1">
            <ReceiptText size={16} className="text-emerald-700" /> Tag: Freelance Tax Deductible
          </button>
        </>
      }
      aside={<button onClick={() => onResolve('Excluded from future debit predictions')} className="px-3 py-1.5 text-secondary hover:text-on-surface font-label-sm text-label-sm">Do not predict future debits</button>}
    >
      <div className="lg:col-span-5 flex items-start gap-space-sm">
        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 shrink-0">
          <Terminal size={26} />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{flag.merchant}</h2>
          </div>
          <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
            <Wallet size={15} />
            <span>{flag.account}</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm pt-1">
            <Clock size={14} />
            <span>{flag.time}</span>
            <span className="text-outline-variant">•</span>
            <span className="text-primary font-medium">{flag.fx}</span>
          </div>
        </div>
      </div>
      <div className="lg:col-span-7 bg-surface-container-low rounded-lg p-space-sm space-y-space-xs">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Rule &amp; Tax Deduction Engine</span>
          <span className="font-currency-md text-currency-md font-semibold text-on-surface">
            {formatCurrency(flag.amount, { decimals: 2 })} <span className="text-label-sm text-secondary">DR</span>
          </span>
        </div>
        <div className="p-2.5 rounded-md bg-surface-container-lowest flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2">
            <Repeat size={20} className="text-primary" />
            <div className="text-left">
              <div className="font-label-md text-label-md text-on-surface font-semibold">Detect monthly SaaS recurrence?</div>
              <div className="font-label-sm text-label-sm text-secondary">
                Forecast {formatCurrency(flag.amount)} debit on the {flag.recurringDay} of each month.
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input className="sr-only peer" type="checkbox" checked={detectRecurring} onChange={(e) => setDetectRecurring(e.target.checked)} />
            <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container" />
          </label>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-label-sm text-label-sm text-secondary">{flag.markupNote}</span>
          <span className="font-label-sm text-label-sm text-emerald-700 font-medium">{flag.taxNote}</span>
        </div>
      </div>
    </FlagCardShell>
  );
}
