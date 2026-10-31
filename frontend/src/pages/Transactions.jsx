// Transactions screen: summary, filters, unified ledger, change-category dialog, manual entry and export.
import { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { FileDown, WandSparkles } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { correctCategory, getTransactions, undoCorrection } from '../services/api';
import PageState from '../components/ui/PageState';
import { downloadCsv } from '../utils/download';
import TransactionSummary from '../components/transactions/TransactionSummary';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import ChangeCategoryDialog from '../components/dialogs/ChangeCategoryDialog';
import UndoToast from '../components/transactions/UndoToast';
import Toast from '../components/ui/Toast';
import CashButton from '../cash/CashButton';
import { useCash } from '../cash/cashContext';

const accountLabel = (tx) => (tx.cash ? 'Cash wallet' : `${tx.bank} ••${tx.last4}`);
function matches(tx, filters) {
  const text = `${tx.merchant} ${tx.reference} ${tx.category} ${Math.abs(tx.amount)}`.toLowerCase();
  if (filters.query && !text.includes(filters.query.toLowerCase())) return false;
  if (filters.account !== 'all' && accountLabel(tx) !== filters.account) return false;
  if (filters.category !== 'all' && tx.category !== filters.category) return false;
  if (filters.flow === 'Debits' && tx.amount > 0) return false;
  if (filters.flow === 'Credits' && tx.amount < 0) return false;
  if (filters.flow === 'Cash only' && !tx.cash) return false;
  return true;
}

export default function Transactions() {
  const api = useApi(getTransactions);
  const location = useLocation();
  const { account } = useOutletContext();
  const [filters, setFilters] = useState({ query: location.state?.query || '', account: 'all', category: 'all', flow: 'All' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [editing, setEditing] = useState(null);
  const [undo, setUndo] = useState(null); // { batchId, message } of the last category change
  const [toast, showToast] = useToast();
  const { openCash } = useCash();

  // The account picked in the top bar filters this page too; so does a search typed there.
  useEffect(() => {
    setFilters((f) => ({ ...f, account }));
  }, [account]);
  useEffect(() => {
    if (location.state?.query !== undefined) setFilters((f) => ({ ...f, query: location.state.query }));
  }, [location.state]);

  if (!api.ready) return <PageState state={api} />;
  const data = api.data;
  const rows = data.transactions;
  const visible = rows.filter((tx) => matches(tx, filters));
  const categories = [...new Set([...rows.map((tx) => tx.category), ...data.categoryOptions.map((o) => o.name)])];
  const accounts = [...new Set(rows.map(accountLabel))];

  function toggleRow(id) {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  function toggleAll(ids, allSelected) {
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  }

  // "Update this one" changes the edited row; "Apply to N" also changes every row from the same merchant (the server remembers it).
  async function applyCategory(category, count) {
    const option = data.categoryOptions.find((o) => o.name === category);
    try {
      const result = await correctCategory(editing.id, option.id, count > 1);
      setUndo({ batchId: result.batchId, message: `Updated ${result.changed.length} transaction${result.changed.length === 1 ? '' : 's'} to ${category}` });
    } catch (err) {
      showToast(err.message);
    }
    setEditing(null);
  }

  // A cash row typed in by the user opens the cash sheet (amount, category, date, note, delete) instead of the category dialog.
  function editCash(tx) {
    const received = tx.amount > 0;
    openCash({ entry: { id: tx.id, type: received ? 'received' : 'spent', amountPaise: Math.round(Math.abs(tx.amount) * 100), category: tx.category,
      sourceType: received ? tx.shortName.slice(5).toLowerCase() : null, date: tx.isoDate, note: tx.note || '' } });
  }

  // Bulk Categorize works on the ticked rows, or the first visible row if nothing is ticked.
  function openBulk() {
    const first = rows.find((tx) => selectedIds.includes(tx.id)) || visible[0];
    if (first) setEditing(first);
  }

  function exportCsv() {
    downloadCsv(
      'smartgullak-transactions.csv',
      visible.map((tx) => ({ date: tx.date, merchant: tx.merchant, reference: tx.reference, account: accountLabel(tx), category: tx.category, amount: tx.amount })),
    );
    showToast(`Exported ${visible.length} transactions`);
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
              <p className="font-body-sm text-body-sm text-secondary">Unified ledger of every statement you uploaded, with transfers between your own accounts marked and left out of totals.</p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <CashButton className="hidden md:flex" />
              <button
                className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm"
                onClick={exportCsv}
              >
                <FileDown size={18} className="text-secondary" />
                <span>Export CSV / Excel</span>
              </button>
              <button
                className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm"
                onClick={openBulk}
              >
                <WandSparkles size={18} className="text-primary" />
                <span>Bulk Categorize</span>
              </button>
            </div>
          </div>

          <TransactionSummary summary={data.summary} />
          <TransactionFilters
            filters={filters}
            onChange={setFilters}
            accounts={accounts}
            categories={categories}
            dateRange={data.filters.dateRange}
          />
          <TransactionTable
            transactions={visible}
            totalRecords={data.totalRecords}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onEditCategory={setEditing}
            onEditCash={editCash}
          />
        </div>

        <ChangeCategoryDialog
          key={editing?.id || 'none'}
          open={editing !== null}
          transaction={editing}
          options={data.categoryOptions}
          similar={editing ? rows.filter((tx) => tx.shortName === editing.shortName && tx.id !== editing.id) : []}
          onClose={() => setEditing(null)}
          onApply={applyCategory}
        />
        {undo && (
          <UndoToast
            message={undo.message}
            onUndo={async () => {
              await undoCorrection(undo.batchId);
              setUndo(null);
              showToast('Change undone');
            }}
            onClose={() => setUndo(null)}
          />
        )}
        <Toast message={toast} />
      </div>
    </main>
  );
}
