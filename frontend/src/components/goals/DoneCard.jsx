// A finished goal: trophy badge, name, what was saved, and a menu to remove it.
import { Trash2, Trophy } from 'lucide-react';
import { tileFor } from './goalKit';
import { exact, rounded } from '../../utils/money';

export default function DoneCard({ goal, index, onDelete }) {
  const Icon = tileFor(goal.rawName, goal.category).icon;
  return (
    <article className="goal-in rounded-2xl bg-white border border-emerald-100 shadow-sm p-4 flex items-center gap-3.5" style={{ '--delay': `${index * 60}ms` }}>
      <span className="relative h-12 w-12 shrink-0 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
        <Icon size={22} aria-hidden="true" />
        <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-400 text-white flex items-center justify-center ring-2 ring-white"><Trophy size={13} aria-hidden="true" /></span>
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[16px] font-bold text-[#0b2545]">{goal.name}</h3>
        <p className="text-[13px] text-emerald-800 font-medium">Reached <span className="tabular-nums" title={`Exact: ${exact(goal.target)}`}>{rounded(goal.target)}</span></p>
      </div>
      <button type="button" onClick={onDelete} aria-label={`Delete ${goal.name}`} className="h-9 w-9 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 flex items-center justify-center">
        <Trash2 size={17} aria-hidden="true" />
      </button>
    </article>
  );
}
