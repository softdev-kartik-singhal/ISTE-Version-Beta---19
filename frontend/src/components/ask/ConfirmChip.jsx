// What we understood, as one chip: "₹80,000 · October 2026 — the month after your latest statement · Edit".
// Edit opens the amount and month inline; saving re-runs the answer. Until the first answer there is a "Looks right" button.
import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const FIELD = 'h-10 px-3 rounded-xl bg-slate-100 text-[#0b2545] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]';

// fields = { amount: '80000', month: '2026-10' }; onConfirm(values) calculates the answer with those values.
export default function ConfirmChip({ fields, candidates, monthText, answered, busy, onConfirm }) {
  const complete = Number(fields.amount) > 0 && Boolean(fields.month);
  const [editing, setEditing] = useState(!complete); // nothing usable parsed yet → start in edit mode
  const [draft, setDraft] = useState(fields);
  const draftOk = Number(draft.amount) > 0 && Boolean(draft.month);

  function save(e) {
    e.preventDefault();
    setEditing(false);
    onConfirm(draft);
  }

  if (editing) {
    return (
      <form onSubmit={save} className="ask-pop rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
        {candidates.length > 1 && <p className="text-[13px] text-slate-600">I found more than one amount ({candidates.map((c) => c.text).join(', ')}). Enter the one you mean.</p>}
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-600">
            Amount (₹)
            <input className={FIELD} type="number" min="1" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} autoFocus />
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-600">
            Month
            <input className={FIELD} type="month" value={draft.month} onChange={(e) => setDraft({ ...draft, month: e.target.value })} />
          </label>
          <button type="submit" disabled={busy || !draftOk} data-tour="ask-confirm" className="h-10 px-5 rounded-xl bg-[#1d4ed8] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 hover:bg-[#1e40af]">
            <Check size={16} aria-hidden="true" /> {answered ? 'Update answer' : 'Check it'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="ask-pop flex flex-wrap items-center gap-2">
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-[14px] text-[#0b2545]">
        <strong className="tabular">{formatCurrency(Number(fields.amount))}</strong>
        <span className="text-slate-400" aria-hidden="true">·</span>
        <span>{monthText}</span>
        <span className="text-slate-400" aria-hidden="true">·</span>
        <button type="button" onClick={() => { setDraft(fields); setEditing(true); }} className="inline-flex items-center gap-1 font-semibold text-[#1d4ed8] hover:underline">
          <Pencil size={13} aria-hidden="true" /> Edit
        </button>
      </span>
      {!answered && (
        <button type="button" disabled={busy} data-tour="ask-confirm" onClick={() => onConfirm(fields)} className="h-10 px-5 rounded-full bg-[#1d4ed8] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 hover:bg-[#1e40af]">
          <Check size={16} aria-hidden="true" /> Looks right
        </button>
      )}
    </div>
  );
}
