// "Change Category" dialog: pick a new category, review similar merchant transactions, apply to one or all.
import { useState } from 'react';
import { CircleCheck, Sparkles, X } from 'lucide-react';
import Modal from '../ui/Modal';
import { iconFor } from '../../utils/icons';
import { formatCurrency } from '../../utils/formatCurrency';

// similar: other ledger rows from the same merchant, which "Apply to N" also recategorises.
export default function ChangeCategoryDialog({ open, transaction, options, similar, onClose, onApply }) {
  const [selected, setSelected] = useState(options[0].name);
  if (!transaction) return null;
  const merchantKey = transaction.shortName.toUpperCase();

  return (
    <Modal open={open} onClose={onClose} overlayClass="p-space-md bg-inverse-surface/40 overflow-y-auto">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-space-xl py-space-lg bg-surface-container-low flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Change Category for {transaction.shortName}</h2>
            <p className="font-label-sm text-label-sm text-secondary">Recalibrate taxonomy across accounts and auto-tag rules</p>
          </div>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-surface hover:text-on-surface transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-space-xl space-y-space-lg max-h-[768px] overflow-y-auto">
          <div className="p-space-md rounded-lg bg-surface flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">{transaction.initials}</div>
              <div className="min-w-0">
                <div className="font-label-md text-label-md font-semibold text-on-surface truncate">{transaction.merchant}</div>
                <div className="font-label-sm text-label-sm text-secondary truncate">
                  {transaction.date} • {transaction.bankName} ••{transaction.last4} • Current:{' '}
                  <span className="font-medium text-on-surface">{transaction.category}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-currency-md text-currency-md font-semibold text-on-surface">{formatCurrency(transaction.amount, { decimals: 2 })}</div>
              <div className="font-label-sm text-label-sm text-secondary">{transaction.amount < 0 ? 'DR' : 'CR'} Clearing</div>
            </div>
          </div>

          <div className="space-y-space-sm">
            <label className="font-label-md text-label-md text-secondary uppercase tracking-wider block">Select Target Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              {options.map((option) => {
                const Icon = iconFor(option.icon);
                const active = option.name === selected;
                return (
                  <div
                    key={option.name}
                    onClick={() => setSelected(option.name)}
                    className={
                      active
                        ? 'p-space-md rounded-lg bg-surface-container-low cursor-pointer flex items-center justify-between shadow-sm'
                        : 'p-space-md rounded-lg bg-surface hover:bg-surface-container-low cursor-pointer flex items-center justify-between transition-colors'
                    }
                  >
                    <div className="flex items-center gap-space-sm">
                      <Icon size={20} className={active ? 'text-primary' : 'text-secondary'} />
                      <div>
                        <div className="font-label-md text-label-md font-semibold text-on-surface">{option.name}</div>
                        <div className="font-label-sm text-label-sm text-secondary">{option.description}</div>
                      </div>
                    </div>
                    {active && <CircleCheck size={20} className="text-primary" />}
                  </div>
                );
              })}
            </div>
          </div>

          {similar.length > 0 && (
          <div className="p-space-md rounded-xl bg-surface-container space-y-space-md">
            <div className="flex items-start gap-space-sm">
              <Sparkles size={22} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-headline-sm text-body-md font-semibold text-on-surface">SmartGullak detected recurring merchant pattern</div>
                <p className="font-body-sm text-body-sm text-secondary leading-relaxed">
                  This will also update {similar.length} similar transaction{similar.length === 1 ? '' : 's'} from {merchantKey}. Select transactions to bulk-apply{' '}
                  <span className="font-semibold text-on-surface">{selected}</span> and calibrate future statement auto-classification.
                </p>
              </div>
            </div>
            <div className="pt-space-xs flex items-center justify-between font-label-md text-label-md text-on-surface">
              <label className="flex items-center gap-2 cursor-pointer">
                <input defaultChecked className="w-4 h-4 rounded text-primary-container focus:ring-0 cursor-pointer" type="checkbox" />
                <span>Select all {similar.length} matching transactions</span>
              </label>
              <span className="text-secondary font-label-sm text-label-sm">
                {similar.length} of {similar.length} selected
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg bg-surface-container-lowest p-space-xs space-y-1">
              {similar.map((m) => (
                <label key={m.id} className="flex items-center justify-between p-2 rounded hover:bg-surface cursor-pointer text-body-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <input defaultChecked className="w-3.5 h-3.5 rounded text-primary-container focus:ring-0" type="checkbox" />
                    <span className="text-secondary font-label-sm">{m.date}</span>
                    <span className="truncate font-medium text-on-surface">{m.merchant}</span>
                    <span className="text-secondary font-label-sm">
                      ({m.bank} ••{m.last4})
                    </span>
                  </div>
                  <span className="font-currency-sm text-currency-sm font-medium text-on-surface ml-2">{formatCurrency(Math.abs(m.amount), { decimals: 2 })} {m.amount < 0 ? 'DR' : 'CR'}</span>
                </label>
              ))}
            </div>
            <div className="pt-space-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input defaultChecked className="w-4 h-4 mt-0.5 rounded text-primary-container focus:ring-0 cursor-pointer" type="checkbox" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Always apply this rule to future {merchantKey} transactions
                  </span>
                  <p className="font-label-sm text-label-sm text-secondary">
                    Eliminates repeated manual classification on new monthly statements from all 3 connected banks.
                  </p>
                </div>
              </label>
            </div>
          </div>
          )}
        </div>

        <div className="px-space-xl py-space-md bg-surface-container-low flex items-center justify-between">
          <button className="h-10 px-space-md rounded-lg text-secondary hover:text-on-surface font-label-md text-label-md transition-colors" onClick={onClose}>
            Cancel
          </button>
          <div className="flex items-center gap-space-sm">
            <button
              className="h-10 px-space-md rounded-lg bg-surface text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
              onClick={() => onApply(selected, 1)}
            >
              Update This One Only
            </button>
            {similar.length > 0 && (
              <button
                className="h-10 px-space-lg rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all shadow-sm"
                onClick={() => onApply(selected, similar.length + 1)}
              >
                Apply to {similar.length + 1} Transactions
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
