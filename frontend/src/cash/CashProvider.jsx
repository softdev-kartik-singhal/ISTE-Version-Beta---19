// Owns the "+ Cash" sheet for every signed-in screen: opening it, saving, the "Undo" toast, and the floating button on phones.
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { addCash, deleteCash, getCategories, updateCash } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import UndoToast from '../components/transactions/UndoToast';
import Toast from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { CashContext } from './cashContext';
import CashSheet from './CashSheet';
import { SOURCES } from './cashSources';

export function CashProvider({ children }) {
  const [start, setStart] = useState(null); // null = sheet closed; {} = add; { entry } = edit; { amountPaise } = prefilled add
  const [categories, setCategories] = useState([]);
  const [undo, setUndo] = useState(null); // { id, message } of the entry just added
  const [toast, showToast] = useToast();

  // The Undo offer fades away after a few seconds.
  useEffect(() => {
    if (!undo) return undefined;
    const timer = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(timer);
  }, [undo]);

  useEffect(() => {
    getCategories()
      .then((list) => setCategories(list.filter((c) => c.kind === 'expense').map((c) => c.name)))
      .catch(() => {});
  }, []);

  async function submit(values) {
    if (start.entry) {
      await updateCash(start.entry.id, values);
      showToast('Cash entry updated');
    } else {
      const { entry, duplicateWarning } = await addCash(values);
      const where = values.type === 'spent' ? values.category : SOURCES.find((s) => s.id === values.sourceType).label;
      const what = values.type === 'spent' ? `cash added to ${where}` : `cash received (${where.toLowerCase()})`;
      setUndo({ id: entry.id, message: `${formatCurrency(values.amountPaise / 100)} ${what}${duplicateWarning ? ' — looks like one you already added' : ''}` });
    }
    setStart(null);
  }

  async function remove() {
    try {
      await deleteCash(start.entry.id);
      showToast('Cash entry deleted');
      setStart(null);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function undoAdd() {
    const id = undo.id;
    setUndo(null);
    await deleteCash(id).catch((err) => showToast(err.message));
  }

  return (
    <CashContext.Provider value={{ openCash: (s = {}) => setStart(s) }}>
      {children}
      {/* Floating "+ Cash" button, phones only (wider screens have it in the page headers). */}
      <button aria-label="Add cash" className="md:hidden fixed bottom-20 right-5 z-40 h-14 px-5 rounded-full bg-primary-container text-white shadow-xl flex items-center gap-1.5 font-label-md text-label-md" onClick={() => setStart({})}>
        <Plus size={20} /> Cash
      </button>
      {start && <CashSheet key={start.entry?.id || 'new'} start={start} categories={categories} onSubmit={submit} onDelete={remove} onClose={() => setStart(null)} />}
      {undo && <UndoToast message={undo.message} onUndo={undoAdd} onClose={() => setUndo(null)} />}
      <Toast message={toast} />
    </CashContext.Provider>
  );
}
