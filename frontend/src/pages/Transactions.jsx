// Transactions screen: summary, filters, unified ledger, change-category dialog, manual entry and export.
import { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { FileDown, Plus, WandSparkles } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { getTransactions } from '../services/api';
import { downloadCsv } from '../utils/download';
import TransactionSummary from '../components/transactions/TransactionSummary';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import ChangeCategoryDialog from '../components/dialogs/ChangeCategoryDialog';
import UndoToast from '../components/transactions/UndoToast';
import FormDialog from '../components/ui/FormDialog';
import Toast from '../components/ui/Toast';

const accountLabel = (tx) => `${tx.bank} ••${tx.last4}`;
const ACCOUNTS = {
  'HDFC ••8491': { bank: 'HDFC', bankName: 'HDFC Bank', last4: '8491' },
  'ICICI ••4022': { bank: 'ICICI', bankName: 'ICICI Bank', last4: '4022' },
  'Kotak ••1190': { bank: 'Kotak', bankName: 'Kotak Mahindra', last4: '1190' },
};

function matches(tx, filters) {
  const text = `${tx.merchant} ${tx.reference} ${tx.category} ${Math.abs(tx.amount)}`.toLowerCase();
  if (filters.query && !text.includes(filters.query.toLowerCase())) return false;
  if (filters.account !== 'all' && accountLabel(tx) !== filters.account) return false;
  if (filters.category !== 'all' && tx.category !== filters.category) return false;
  if (filters.flow === 'Debits' && tx.amount > 0) return false;
  if (filters.flow === 'Credits' && tx.amount < 0) return false;
  return true;
}

export default function Transactions() {
  const data = useApi(getTransactions);
  const location = useLocation();
  const { account } = useOutletContext();
  const [rows, setRows] = useState(null);
  const [filters, setFilters] = useState({ query: location.state?.query || '', account: 'all', category: 'all', flow: 'All' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [editing, setEditing] = useState(null);
  const [undo, setUndo] = useState(null);
  const [adding, setAdding] = useState(false);
  const [toast, showToast] = useToast();

  // Keep a local, editable copy of the ledger once it loads.
  useEffect(() => {
    if (data) setRows(data.transactions);
  }, [data]);

  // The account picked in the top bar filters this page too; so does a search typed there.
  useEffect(() => {
    setFilters((f) => ({ ...f, account }));
  }, [account]);
  useEffect(() => {
    if (location.state?.query !== undefined) setFilters((f) => ({ ...f, query: location.state.query }));
  }, [location.state]);

  if (!data || !rows) return null;

  const visible = rows.filter((tx) => matches(tx, filters));
  const categories = [...new Set([...rows.map((tx) => tx.category), ...data.categoryOptions.map((o) => o.name)])];

  function toggleRow(id) {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  function toggleAll(ids, allSelected) {
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  }

  // "Update this one" changes the edited row; "Apply to N" also changes every row from the same merchant.
  function applyCategory(category, count) {
    const target = editing;
    const affected = count === 1 ? [target.id] : rows.filter((tx) => tx.shortName === target.shortName).map((tx) => tx.id);
    setUndo({ previous: rows, message: `Updated ${count} transaction${count === 1 ? '' : 's'} to ${category}` });
    setRows(rows.map((tx) => (affected.includes(tx.id) ? { ...tx, category } : tx)));
    setEditing(null);
  }

  // Bulk Categorize works on the ticked rows, or the first visible row if nothing is ticked.
  function openBulk() {
    const first = rows.find((tx) => selectedIds.includes(tx.id)) || visible[0];
    if (first) setEditing(first);
  }

  function addTransaction(values) {
    const amount = Number(values.amount) * (values.type === 'Credit' ? 1 : -1);
    const date = new Date(values.date);
    const tx = {
      id: `manual-${Date.now()}`,
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: 'Manual',
      initials: values.merchant.slice(0, 2).toUpperCase(),
      merchant: values.merchant,
      shortName: values.merchant,
      channel: 'Cash',
      reference: 'MANUAL/CASH-ENTRY',
      ...ACCOUNTS[values.account],
      category: values.category,
      amount,
    };
    setRows([tx, ...rows]);
    setAdding(false);
    showToast(`Added ${values.merchant}`);
  }

  function deleteRow(tx) {
    if (!window.confirm(`Delete "${tx.merchant}" (${tx.date})?`)) return;
    setUndo({ previous: rows, message: `Deleted ${tx.merchant}` });
    setRows(rows.filter((r) => r.id !== tx.id));
  }

  function exportCsv() {
    downloadCsv(
      'smartgullak-transactions.csv',
      visible.map((tx) => ({
        date: tx.date,
        time: tx.time,
        merchant: tx.merchant,
        reference: tx.reference,
        account: accountLabel(tx),
        category: tx.category,
        amount: tx.amount,
      })),
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
              <p className="font-body-sm text-body-sm text-secondary">Unified transaction ledger normalized across HDFC, ICICI, and Kotak accounts.</p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
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
              <button
                className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center gap-2 hover:bg-primary transition-all shadow-sm"
                onClick={() => setAdding(true)}
              >
                <Plus size={18} />
                <span>Add Manual Transaction</span>
              </button>
            </div>
          </div>

          <TransactionSummary summary={data.summary} />
          <TransactionFilters
            filters={filters}
            onChange={setFilters}
            accounts={Object.keys(ACCOUNTS)}
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
            onDelete={deleteRow}
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
        <FormDialog
          key={adding ? 'add-open' : 'add-closed'}
          open={adding}
          title="Add Manual Transaction"
          fields={[
            { name: 'merchant', label: 'Merchant / description', placeholder: 'e.g. Local kirana store' },
            { name: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '450' },
            { name: 'type', label: 'Type', options: ['Debit', 'Credit'] },
            { name: 'date', label: 'Date', type: 'date' },
            { name: 'account', label: 'Account', options: Object.keys(ACCOUNTS) },
            { name: 'category', label: 'Category', options: categories },
          ]}
          initialValues={{
            merchant: '',
            amount: '',
            type: 'Debit',
            date: new Date().toISOString().slice(0, 10),
            account: 'HDFC ••8491',
            category: categories[0],
          }}
          submitLabel="Add transaction"
          onClose={() => setAdding(false)}
          onSubmit={addTransaction}
        />
        {undo && (
          <UndoToast
            message={undo.message}
            onUndo={() => {
              setRows(undo.previous);
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
