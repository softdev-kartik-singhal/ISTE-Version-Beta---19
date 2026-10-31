// Recent questions: the last 3 as small cards (what, how much, verdict, when). Click one to open its answer again.
import { History } from 'lucide-react';
import VerdictBadge from '../ui/VerdictBadge';
import { exact, rounded } from '../../utils/money';
import { monthLabel } from '../../services/adapters';

const what = (q) => q.replace(/^Can I (afford|take) an? /i, '').replace(/\?$/, '');

export default function RecentQuestions({ items, onOpen }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="recent" className="space-y-3">
      <h2 id="recent" className="flex items-center gap-2 text-[17px] font-semibold text-[#0b2545]"><History size={18} className="text-slate-500" aria-hidden="true" /> Recent questions</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((q) => (
          <button key={`${q.text}-${q.amount}-${q.month}`} type="button" onClick={() => onOpen(q)}
            className="ask-card p-4 text-left space-y-2 hover:-translate-y-0.5 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]">
            <span className="block text-[14px] font-semibold text-[#0b2545] line-clamp-2">{what(q.text)}</span>
            <span className="block tabular text-[13px] text-slate-600" title={`Exact: ${exact(q.amount)}`}>{rounded(q.amount)} · {monthLabel(q.month)}</span>
            <VerdictBadge state={q.state} size="sm" />
            <span className="block text-[11px] text-slate-500">{new Date(q.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
