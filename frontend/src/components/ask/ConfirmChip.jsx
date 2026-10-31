// What Ask understood, as one chip: "₹80,000 · December 2026 · Edit". Edit opens the amount and month inline and re-runs the answer.
import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { monthLabel } from '../../services/adapters';

const FIELD = 'h-9 px-3 rounded-lg bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container';

// fields = { amount: '80000', month: '2026-12' }; onSubmit(fields) recalculates with the corrected values.
export default function ConfirmChip({ fields, candidates, busy, onSubmit }) {
  const complete = Number(fields.amount) > 0 && Boolean(fields.month);
  const [editing, setEditing] = useState(!complete); // nothing to show yet → start in edit mode
  const [draft, setDraft] = useState(fields);
  const draftOk = Number(draft.amount) > 0 && Boolean(draft.month);

  function save(event) {
    event.preventDefault();
    setEditing(false);
    onSubmit(draft);
  }

  if (!editing) {
    return (
      <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest shadow-sm font-label-md text-label-md text-on-surface">
        <span className="text-secondary">I understood:</span>
        <span className="font-semibold">{formatCurrency(Number(fields.amount))}</span>
        <span className="text-outline">·</span>
        <span className="font-semibold">{monthLabel(fields.month)}</span>
        <span className="text-outline">·</span>
        <button type="button" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline" onClick={() => { setDraft(fields); setEditing(true); }}>
          <Pencil size={13} /> Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="rounded-xl bg-surface-container-lowest shadow-sm p-space-md space-y-space-sm">
      {candidates.length > 1 && (
        <p className="font-body-sm text-body-sm text-secondary">I found more than one amount ({candidates.map((c) => c.text).join(', ')}). Enter the one you mean.</p>
      )}
      <div className="flex flex-wrap items-end gap-space-sm">
        <label className="flex flex-col gap-1 font-label-sm text-label-sm text-secondary">
          Amount (₹)
          <input className={FIELD} type="number" min="1" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} autoFocus />
        </label>
        <label className="flex flex-col gap-1 font-label-sm text-label-sm text-secondary">
          Month
          <input className={FIELD} type="month" value={draft.month} onChange={(e) => setDraft({ ...draft, month: e.target.value })} />
        </label>
        <button className="h-9 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md inline-flex items-center gap-1.5 disabled:opacity-60" disabled={busy || !draftOk}>
          <Check size={15} /> {complete ? 'Update answer' : 'Calculate'}
        </button>
      </div>
    </form>
  );
}
