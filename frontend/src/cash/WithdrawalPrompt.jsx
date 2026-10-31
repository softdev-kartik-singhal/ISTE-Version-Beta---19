// After an upload: "You withdrew ₹1,000 cash on 12 Oct. Where did it go?" with a quick split into categories, or Skip.
import { useEffect, useState } from 'react';
import { Banknote, Plus, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getCash, getCategories, splitWithdrawal } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const SKIPPED = 'sg_atm_skipped';
const rupees = (paise) => formatCurrency(paise / 100);
const dayMonth = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const FIELD = 'h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container';

function skippedIds() {
  try {
    return JSON.parse(localStorage.getItem(SKIPPED) || '[]');
  } catch {
    return [];
  }
}

export default function WithdrawalPrompt() {
  const api = useApi(getCash);
  const [categories, setCategories] = useState([]);
  const [skipped, setSkipped] = useState(skippedIds);
  const [rows, setRows] = useState([{ amount: '', category: 'Food & Dining' }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCategories().then((list) => setCategories(list.filter((c) => c.kind === 'expense').map((c) => c.name))).catch(() => {});
  }, []);

  // The newest withdrawal that still has cash nobody has accounted for and that the user has not skipped.
  const w = api.ready ? api.data.withdrawals.find((x) => x.unaccountedPaise > 0 && !skipped.includes(x.id)) : null;
  if (!w) return null;

  const parts = rows.map((r) => ({ amountPaise: Math.round(Number(r.amount) * 100), category: r.category })).filter((p) => p.amountPaise > 0);
  const total = parts.reduce((sum, p) => sum + p.amountPaise, 0);
  const left = w.unaccountedPaise - total;
  const setRow = (i, field, value) => setRows(rows.map((r, j) => (j === i ? { ...r, [field]: value } : r)));

  function skip() {
    const next = [...skipped, w.id];
    setSkipped(next);
    try {
      localStorage.setItem(SKIPPED, JSON.stringify(next));
    } catch {
      /* storage blocked: it just asks again next time */
    }
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      await splitWithdrawal(w.id, parts);
      setRows([{ amount: '', category: 'Food & Dining' }]);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <section className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg space-y-space-md border border-secondary-fixed">
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed/60 text-primary flex items-center justify-center"><Banknote size={20} /></div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              You withdrew {rupees(w.amountPaise)} cash on {dayMonth(w.date)}. Where did it go?
            </h3>
            {w.unaccountedPaise < w.amountPaise && <p className="font-body-sm text-body-sm text-secondary">{rupees(w.unaccountedPaise)} is still unrecorded.</p>}
          </div>
        </div>
        <button className="p-1 text-secondary hover:text-on-surface" onClick={skip} aria-label="Skip"><X size={18} /></button>
      </div>

      <div className="space-y-space-sm">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-space-sm">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">₹</span>
              <input inputMode="decimal" className={`${FIELD} w-32 pl-7`} placeholder="Amount" value={r.amount} onChange={(e) => setRow(i, 'amount', e.target.value.replace(/[^\d.]/g, ''))} />
            </div>
            <select className={FIELD} value={r.category} onChange={(e) => setRow(i, 'category', e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            {rows.length > 1 && (
              <button className="p-1 text-secondary hover:text-error" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove row"><X size={16} /></button>
            )}
          </div>
        ))}
        <button className="font-label-md text-label-md text-primary flex items-center gap-1 hover:underline" onClick={() => setRows([...rows, { amount: left > 0 ? String(left / 100) : '', category: 'Other' }])}>
          <Plus size={15} /> Add a row
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <p className={`font-label-md text-label-md ${left < 0 ? 'text-error' : 'text-secondary'}`}>
          {left === 0 ? 'All of it is accounted for.' : left > 0 ? `${rupees(left)} left to place` : `${rupees(-left)} more than the withdrawal`}
        </p>
        <div className="flex items-center gap-space-sm">
          <button className="h-10 px-space-md rounded-lg text-secondary hover:bg-surface-container font-label-md text-label-md" onClick={skip}>Skip</button>
          <button className="h-10 px-space-lg rounded-lg bg-primary-container text-white hover:bg-primary font-label-md text-label-md shadow-sm disabled:opacity-50" disabled={busy || left !== 0 || !parts.length} onClick={save}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
    </section>
  );
}
