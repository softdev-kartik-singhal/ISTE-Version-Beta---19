// The "+ Cash" sheet: two tabs (Spent / Received), a big amount, tappable category chips, date and an optional note.
// A bottom sheet on phones, a centred card on wider screens. Editing an existing entry also offers Delete.
import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { SOURCES } from './cashSources';
import { iconFor } from '../utils/icons';
import { catIcon } from '../services/adapters';

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the user's timezone
const CHIP = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-label-md text-label-md transition-colors';
const CHIP_ON = 'bg-primary-container text-white';
const CHIP_OFF = 'bg-surface-container text-on-surface hover:bg-surface-container-high';
const FIELD = 'h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container';

// start: { entry } to edit, or { amountPaise } to prefill. categories: names of the spending categories.
export default function CashSheet({ start, categories, onSubmit, onDelete, onClose }) {
  const entry = start?.entry;
  const [type, setType] = useState(entry?.type || 'spent');
  const [amount, setAmount] = useState(entry ? String(entry.amountPaise / 100) : start?.amountPaise ? String(start.amountPaise / 100) : '');
  const [category, setCategory] = useState(entry?.category || 'Food & Dining');
  const [source, setSource] = useState(entry?.sourceType || 'gift');
  const [date, setDate] = useState(entry?.date || today());
  const [note, setNote] = useState(entry?.note || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const amountPaise = Math.round(Number(amount) * 100);
  const valid = amountPaise > 0 && (type === 'received' || categories.includes(category));

  async function submit(e) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit({ type, amountPaise, date, note, ...(type === 'spent' ? { category } : { sourceType: source }) });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-on-background/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="w-full md:max-w-md max-h-[92vh] overflow-y-auto bg-surface-container-lowest rounded-t-2xl md:rounded-2xl shadow-xl p-space-lg space-y-space-md" role="dialog" aria-label="Add cash">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{entry ? 'Edit cash entry' : 'Add cash'}</h2>
          <button type="button" className="p-1 rounded text-secondary hover:text-on-surface" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        {!entry && (
          <div className="grid grid-cols-2 p-1 rounded-lg bg-surface-container">
            {['spent', 'received'].map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`h-9 rounded-md font-label-md text-label-md capitalize transition-colors ${type === t ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-secondary'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        <label className="block">
          <span className="font-label-sm text-label-sm text-secondary">Amount</span>
          <div className="flex items-baseline gap-1 border-b-2 border-primary-container py-1">
            <span className="font-currency-hero text-[32px] text-secondary">₹</span>
            {/* inputMode="decimal" brings up the big number pad on phones */}
            <input autoFocus inputMode="decimal" className="w-full bg-transparent font-currency-hero text-[36px] text-on-surface focus:outline-none" placeholder="0"
              value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} aria-label="Amount in rupees" />
          </div>
        </label>

        <div className="space-y-1.5">
          <span className="font-label-sm text-label-sm text-secondary">{type === 'spent' ? 'Category' : 'Where it came from'}</span>
          <div className="flex flex-wrap gap-2">
            {type === 'spent'
              ? categories.map((c) => {
                  const Icon = iconFor(catIcon(c));
                  return (
                    <button key={c} type="button" className={`${CHIP} ${category === c ? CHIP_ON : CHIP_OFF}`} onClick={() => setCategory(c)}>
                      <Icon size={15} /> {c}
                    </button>
                  );
                })
              : SOURCES.map((s) => (
                  <button key={s.id} type="button" className={`${CHIP} ${source === s.id ? CHIP_ON : CHIP_OFF}`} onClick={() => setSource(s.id)}>
                    <s.icon size={15} /> {s.label}
                  </button>
                ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <label className="flex flex-col gap-1 font-label-sm text-label-sm text-secondary">
            Date
            <input type="date" className={FIELD} value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 font-label-sm text-label-sm text-secondary">
            Note (optional)
            <input className={FIELD} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only you see this" />
          </label>
        </div>

        {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
        <div className="flex items-center gap-space-sm">
          {entry && (
            <button type="button" className="h-11 px-space-md rounded-lg text-error hover:bg-error-container/40 font-label-md text-label-md flex items-center gap-1.5" onClick={onDelete} disabled={busy}>
              <Trash2 size={16} /> Delete
            </button>
          )}
          <button type="submit" disabled={!valid || busy} className="flex-1 h-11 rounded-lg bg-primary-container text-white hover:bg-primary font-label-md text-label-md shadow-sm disabled:opacity-50">
            {busy ? 'Saving...' : entry ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
