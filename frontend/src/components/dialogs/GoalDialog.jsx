// "Create New Financial Goal" dialog with the goal form and the solvency-check preview.
import { useState } from 'react';
import { CalendarDays, ChevronDown, ClipboardCheck, ListPlus, Lock, X } from 'lucide-react';
import Modal from '../ui/Modal';

const INPUT = 'rounded-lg bg-surface-container-lowest text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container';

export default function GoalDialog({ open, onClose, draft, classifications }) {
  const [form, setForm] = useState(draft);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-xl mx-4 overflow-hidden transform transition-all flex flex-col">
        <div className="p-space-lg bg-surface-container-lowest flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-primary font-label-sm text-label-sm font-semibold uppercase tracking-wider mb-1">
              <ListPlus size={16} />
              <span>Capital Orchestrator</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Create New Financial Goal</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
              SmartGullak evaluates feasibility deterministically against your verified cashflow.
            </p>
          </div>
          <button className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="px-space-lg py-space-md flex flex-col gap-space-md overflow-y-auto max-h-[716px]">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-name">Goal Description</label>
            <input id="goal-name" className={`h-10 px-3 font-body-sm text-body-sm ${INPUT}`} type="text" value={form.name} onChange={update('name')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-target">Target Capital</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-currency-sm text-currency-sm text-on-surface-variant font-medium select-none">₹</span>
                <input id="goal-target" className={`w-full h-10 pl-7 pr-3 font-currency-sm text-currency-sm font-medium ${INPUT}`} type="text" value={form.target} onChange={update('target')} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-horizon">Maturity Horizon</label>
              <div className="relative flex items-center">
                <input id="goal-horizon" className={`w-full h-10 pl-3 pr-9 font-body-sm text-body-sm ${INPUT}`} type="text" value={form.horizon} onChange={update('horizon')} />
                <CalendarDays size={18} className="absolute right-3 text-on-surface-variant pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-class">Classification</label>
              <div className="relative flex items-center">
                <select id="goal-class" className={`w-full h-10 pl-3 pr-8 font-body-sm text-body-sm appearance-none cursor-pointer ${INPUT}`} value={form.classification} onChange={update('classification')}>
                  {classifications.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-2.5 text-on-surface-variant pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="goal-seed">Initial Seed Allocation</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-currency-sm text-currency-sm text-on-surface-variant font-medium select-none">₹</span>
                <input id="goal-seed" className={`w-full h-10 pl-7 pr-3 font-currency-sm text-currency-sm font-medium ${INPUT}`} type="text" value={form.seed} onChange={update('seed')} />
              </div>
            </div>
          </div>

          <div className="p-space-md bg-secondary-fixed/30 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-on-secondary-fixed font-label-md text-label-md font-semibold">
                <ClipboardCheck size={18} className="text-primary" />
                <span>Deterministic Solvency Check</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> On track
              </span>
            </div>
            <div className="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">
              <p>
                Requires <strong className="font-currency-sm text-currency-sm text-on-surface font-semibold">{draft.preview.monthly}</strong> across{' '}
                {draft.preview.cycles} continuous billing cycles.
              </p>
              <p className="leading-relaxed">
                Consumes <strong className="text-on-surface font-semibold">{draft.preview.share}</strong> of your median{' '}
                <span className="font-currency-sm text-currency-sm text-on-surface">{draft.preview.median}</span> net liquid surplus. Zero
                encroachment onto the emergency reserve floor.
              </p>
            </div>
          </div>
        </div>

        <div className="p-space-lg bg-surface-container-low flex items-center justify-end gap-space-sm">
          <button
            className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md shadow-sm transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            onClick={onClose}
          >
            <Lock size={18} />
            <span>Create Goal &amp; Lock Schedule</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
