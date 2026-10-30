// Transactions screen: summary, filters, unified ledger, change-category dialog and undo toast.
import { useState } from 'react';
import { FileDown, Plus, WandSparkles } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getTransactions } from '../services/api';
import TransactionSummary from '../components/transactions/TransactionSummary';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import ChangeCategoryDialog from '../components/dialogs/ChangeCategoryDialog';
import UndoToast from '../components/transactions/UndoToast';

export default function Transactions() {
  const data = useApi(getTransactions);
  const [selectedIds, setSelectedIds] = useState(['tx1']);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  if (!data) return null;

  function toggleRow(id) {
    if (id === 'all') {
      const all = data.transactions.map((tx) => tx.id);
      setSelectedIds(selectedIds.length === all.length ? [] : all);
    } else {
      setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
    }
  }

  function applyCategory(category, count) {
    setEditing(null);
    setToast(`Updated ${count} transaction${count === 1 ? '' : 's'} to ${category}`);
  }

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="flex flex-col w-full">
        <div className="max-w-[1440px] w-full mx-auto px-space-xl py-space-lg space-y-space-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Transactions</h1>
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary">{data.totalRecords} records</span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary">Unified transaction ledger normalized across HDFC, ICICI, and Kotak accounts.</p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <button className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm">
                <FileDown size={18} className="text-secondary" />
                <span>Export CSV / Excel</span>
              </button>
              <button
                className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm"
                onClick={() => setEditing(data.transactions[0])}
              >
                <WandSparkles size={18} className="text-primary" />
                <span>Bulk Categorize</span>
              </button>
              <button className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center gap-2 hover:bg-primary transition-all shadow-sm">
                <Plus size={18} />
                <span>Add Manual Transaction</span>
              </button>
            </div>
          </div>

          <TransactionSummary summary={data.summary} />
          <TransactionFilters filters={data.filters} />
          <TransactionTable
            transactions={data.transactions}
            matchCount={data.matchCount}
            totalRecords={data.totalRecords}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onEditCategory={setEditing}
          />
        </div>

        <ChangeCategoryDialog
          open={editing !== null}
          transaction={editing}
          options={data.categoryOptions}
          pattern={data.merchantPattern}
          onClose={() => setEditing(null)}
          onApply={applyCategory}
        />
        {toast && <UndoToast message={toast} onUndo={() => setToast(null)} onClose={() => setToast(null)} />}
      </div>
    </main>
  );
}
