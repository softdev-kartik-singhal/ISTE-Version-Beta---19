// Transactions ledger table with row selection and the pagination footer.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TransactionRow from './TransactionRow';

export default function TransactionTable({ transactions, matchCount, totalRecords, selectedIds, onToggleRow, onEditCategory }) {
  const allSelected = transactions.length > 0 && transactions.every((tx) => selectedIds.includes(tx.id));

  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
      <div className="px-space-lg py-space-sm bg-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="font-label-md text-label-md text-secondary">Showing {matchCount} matching transactions</span>
        </div>
        <div className="flex items-center gap-space-md text-secondary font-label-sm text-label-sm">
          <span>Page 1 of 1</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface text-secondary font-label-md text-label-md uppercase tracking-wider">
              <th className="py-3.5 pl-space-lg pr-3 w-10">
                <input
                  className="w-4 h-4 rounded text-primary-container focus:ring-0 cursor-pointer"
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleRow('all')}
                />
              </th>
              <th className="py-3.5 px-space-md w-32">Date</th>
              <th className="py-3.5 px-space-md">Merchant / Description</th>
              <th className="py-3.5 px-space-md w-44">Account</th>
              <th className="py-3.5 px-space-md w-56">Category</th>
              <th className="py-3.5 px-space-lg text-right w-44">Amount</th>
              <th className="py-3.5 pr-space-lg pl-2 text-right w-12">Action</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                selected={selectedIds.includes(tx.id)}
                onToggle={() => onToggleRow(tx.id)}
                onEditCategory={() => onEditCategory(tx)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-between font-label-sm text-label-sm text-secondary">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select className="bg-surface rounded px-2 py-1 text-on-surface focus:outline-none">
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
          <span className="ml-2">
            1–{matchCount} of {totalRecords}
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <button className="p-1.5 rounded bg-surface text-secondary hover:text-on-surface disabled:opacity-40" disabled>
            <ChevronLeft size={18} />
          </button>
          <span className="px-2 py-1 rounded bg-surface-container-lowest text-on-surface font-medium">1</span>
          <button className="p-1.5 rounded bg-surface text-secondary hover:text-on-surface">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
