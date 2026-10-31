// Two small dialogs: add money to a goal, and confirm deleting one.
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { groupDigits, onlyDigits } from './goalKit';
import { exact, rounded } from '../../utils/money';

const CARD = 'w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl sheet-in';

export function AddMoneyDialog({ goal, onClose, onAdd }) {
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const amount = Number(digits) || 0;
  const chips = [500, 1000, 5000].filter((c) => c < goal.remaining);
  async function submit(e) {
    e.preventDefault();
    if (!amount || busy) return;
    setBusy(true);
    await onAdd(Math.min(amount, goal.remaining));
  }
  return (
    <Modal open onClose={onClose} overlayClass="bg-[#0b2545]/40 p-space-md">
      <form onSubmit={submit} className={CARD}>
        <h2 className="text-[20px] font-bold text-[#0b2545]">Add money to {goal.name}</h2>
        <p className="mt-1 text-[14px] text-slate-600">
          <span title={`Exact: ${exact(goal.remaining)}`}>{rounded(goal.remaining)}</span> to go.
        </p>
        <label htmlFor="add-money" className="mt-5 block text-[13px] font-semibold text-slate-700">Amount</label>
        <div className="relative mt-1.5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-slate-500" aria-hidden="true">₹</span>
          <input id="add-money" autoFocus inputMode="numeric" autoComplete="off" value={groupDigits(digits)} onChange={(e) => setDigits(onlyDigits(e.target.value))}
            className="h-12 w-full rounded-xl border border-slate-200 pl-8 pr-3 text-[18px] font-semibold tabular-nums text-[#0b2545] focus:outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20" placeholder="0" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => <button key={c} type="button" onClick={() => setDigits(String(c))} className="h-9 rounded-full border border-slate-200 px-3.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50">₹{groupDigits(String(c))}</button>)}
          <button type="button" onClick={() => setDigits(String(Math.ceil(goal.remaining)))} className="h-9 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 text-[14px] font-medium text-emerald-800">Finish it</button>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
          <button type="submit" disabled={!amount || busy} className="h-11 rounded-xl bg-[#1d4ed8] px-6 text-[15px] font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50">{busy ? 'Adding...' : 'Add money'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteGoalDialog({ goal, onClose, onDelete }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} overlayClass="bg-[#0b2545]/40 p-space-md">
      <div className={CARD} role="alertdialog" aria-labelledby="delete-goal">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-700"><Trash2 size={21} aria-hidden="true" /></span>
        <h2 id="delete-goal" className="mt-4 text-[20px] font-bold text-[#0b2545]">Delete {goal.name}?</h2>
        <p className="mt-1 text-[14px] text-slate-600">The goal and the {rounded(goal.saved)} you recorded for it will be removed. This can&apos;t be undone.</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-100">Keep it</button>
          <button type="button" disabled={busy} onClick={() => { setBusy(true); onDelete(); }} className="h-11 rounded-xl bg-red-600 px-6 text-[15px] font-semibold text-white hover:bg-red-700 disabled:opacity-60">{busy ? 'Deleting...' : 'Delete goal'}</button>
        </div>
      </div>
    </Modal>
  );
}
