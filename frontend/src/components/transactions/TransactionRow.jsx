// One ledger row: date, merchant with channel and reference, account, editable category pill and amount.
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const ACCOUNT_DOTS = { HDFC: 'bg-primary-container', ICICI: 'bg-primary', Kotak: 'bg-secondary' };

export default function TransactionRow({ tx, selected, onToggle, onEditCategory, onDelete }) {
  const credit = tx.amount > 0;
  return (
    <tr className={selected ? 'bg-surface-container-high transition-colors' : 'hover:bg-surface-container-low transition-colors'}>
      <td className="py-4 pl-space-lg pr-3">
        <input className="w-4 h-4 rounded text-primary-container focus:ring-0 cursor-pointer" type="checkbox" checked={selected} onChange={onToggle} />
      </td>
      <td className="py-4 px-space-md">
        <div className="font-label-md text-label-md text-on-surface">{tx.date}</div>
        <div className="font-label-sm text-label-sm text-secondary">{tx.time}</div>
      </td>
      <td className="py-4 px-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold text-sm">{tx.initials}</div>
          <div>
            <div className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-2">
              <span>{tx.merchant}</span>
              <span className="px-1.5 py-0.2 rounded bg-surface-container font-label-sm text-label-sm text-secondary">{tx.channel}</span>
            </div>
            <div className="font-label-sm text-label-sm text-secondary">{tx.reference}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-space-md">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface font-label-sm text-label-sm text-on-surface">
          <span className={`w-2 h-2 rounded-full ${ACCOUNT_DOTS[tx.bank]}`} />
          <span>
            {tx.bank} ••{tx.last4}
          </span>
        </div>
      </td>
      <td className="py-4 px-space-md">
        <button
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface text-on-surface font-label-sm text-label-sm hover:bg-surface-variant transition-colors"
          onClick={onEditCategory}
        >
          <span>{tx.category}</span>
          <Pencil size={14} className="text-secondary" />
        </button>
      </td>
      {credit ? (
        <td className="py-4 px-space-lg text-right font-currency-md text-currency-md font-semibold text-primary">
          <span className="mr-1">↓</span>
          {formatCurrency(tx.amount, { sign: true })}
          <span className="font-normal">.00 CR</span>
        </td>
      ) : (
        <td className="py-4 px-space-lg text-right font-currency-md text-currency-md font-medium text-on-surface">
          <span className="text-secondary mr-1">↑</span>
          {formatCurrency(tx.amount)}
          <span className="text-secondary font-normal">.00 DR</span>
        </td>
      )}
      <td className="py-4 pr-space-lg pl-2 text-right">
        <button className="p-1 rounded hover:bg-surface-container text-secondary hover:text-error" title="Delete transaction" onClick={onDelete}>
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}
