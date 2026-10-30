// Create / edit goal dialog with a live solvency check against the average monthly surplus.
import { useState } from 'react';
import { CalendarDays, ChevronDown, ClipboardCheck, ListPlus, Lock, X } from 'lucide-react';
import Modal from '../ui/Modal';
import { formatCurrency } from '../../utils/formatCurrency';
import { horizonLabel } from '../../utils/goalMath';

const INPUT = 'rounded-lg bg-surface-container-lowest text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container';
const PREVIEW = {
  onTrack: { label: 'On track', pill: 'bg-secondary-fixed text-on-secondary-fixed', dot: 'bg-primary' },
  tight: { label: 'Tight', pill: 'bg-tertiary-fixed text-on-tertiary-fixed', dot: 'bg-tertiary' },
  unreachable: { label: 'Unreachable', pill: 'bg-error-container text-on-error-container', dot: 'bg-error' },
};

// initial: { name, target, monthsLeft, category, saved }; editing decides the title and button text.
export default function GoalDialog({ open, editing, initial, classifications, averageSurplus, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const target = Number(form.target) || 0;
  const saved = Number(form.saved) || 0;
  const months = Math.max(1, Number(form.monthsLeft) || 1);
  const monthly = Math.max(0, Math.round((target - saved) / months));
  const share = monthly / averageSurplus;
  const status = share <= 0.5 ? 'onTrack' : share <= 1 ? 'tight' : 'unreachable';
  const preview = PREVIEW[status];

  function submit(e) {
    e.preventDefault();
    onSave({ ...form, target, saved, monthsLeft: months });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={submit} className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-xl mx-4 overflow-hidden transform transition-all flex flex-col">
        <div className="p-space-lg bg-surface-container-lowest flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-primary font-label-sm text-label-sm font-semibold uppercase tracking-wider mb-1">
              <ListPlus size={16} />
              <span>Capital Orchestrator</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">{editing ? 'Edit Financial Goal' : 'Create New Financial Goal'}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
              SmartGullak evaluates feasibility deterministically against your verified cashflow.
            </p>
          </div>
          <button type="button" className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="px-space-lg py-space-md flex flex-col gap-space-md overflow-y-auto max-h-[716px]">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-name">Goal Description</label>
            <input id="goal-name" required className={`h-10 px-3 font-body-sm text-body-sm ${INPUT}`} type="text" value={form.name} onChange={update('name')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-target">Target Capital</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-currency-sm text-currency-sm text-on-surface-variant font-medium select-none">₹</span>
                <input id="goal-target" required min="1" className={`w-full h-10 pl-7 pr-3 font-currency-sm text-currency-sm font-medium ${INPUT}`} type="number" value={form.target} onChange={update('target')} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-months">Maturity Horizon (months)</label>
              <div className="relative flex items-center">
                <input id="goal-months" required min="1" className={`w-full h-10 pl-3 pr-9 font-body-sm text-body-sm ${INPUT}`} type="number" value={form.monthsLeft} onChange={update('monthsLeft')} />
                <CalendarDays size={18} className="absolute right-3 text-on-surface-variant pointer-events-none" />
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{horizonLabel(months)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-class">Classification</label>
              <div className="relative flex items-center">
                <select id="goal-class" className={`w-full h-10 pl-3 pr-8 font-body-sm text-body-sm appearance-none cursor-pointer ${INPUT}`} value={form.category} onChange={update('category')}>
                  {classifications.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-2.5 text-on-surface-variant pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-seed">{editing ? 'Accumulated So Far' : 'Initial Seed Allocation'}</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-currency-sm text-currency-sm text-on-surface-variant font-medium select-none">₹</span>
                <input id="goal-seed" min="0" className={`w-full h-10 pl-7 pr-3 font-currency-sm text-currency-sm font-medium ${INPUT}`} type="number" value={form.saved} onChange={update('saved')} />
              </div>
            </div>
          </div>

          <div className="p-space-md bg-secondary-fixed/30 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-on-secondary-fixed font-label-md text-label-md font-semibold">
                <ClipboardCheck size={18} className="text-primary" />
                <span>Deterministic Solvency Check</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold flex items-center gap-1 ${preview.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${preview.dot}`} /> {preview.label}
              </span>
            </div>
            <div className="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">
              <p>
                Requires <strong className="font-currency-sm text-currency-sm text-on-surface font-semibold">{formatCurrency(monthly)}/month</strong> across {months}{' '}
                continuous billing cycles.
              </p>
              <p className="leading-relaxed">
                Consumes <strong className="text-on-surface font-semibold">{(share * 100).toFixed(1)}%</strong> of your median{' '}
                <span className="font-currency-sm text-currency-sm text-on-surface">{formatCurrency(averageSurplus)}/mo</span> net liquid surplus.
                {share <= 1 ? ' Zero encroachment onto the emergency reserve floor.' : ' This exceeds your surplus — extend the horizon.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-space-lg bg-surface-container-low flex items-center justify-end gap-space-sm">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md shadow-sm transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Lock size={18} />
            <span>{editing ? 'Save Changes' : 'Create Goal & Lock Schedule'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
