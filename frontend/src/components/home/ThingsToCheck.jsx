// "Things to check": up to 3 flags as small cards (repeats of the same kind at the same shop grouped),
// each with Review and Looks fine, plus a "See all" link.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Copy, Store, TrendingUp } from 'lucide-react';
import { decideFlag } from '../../services/api';
import { exact, rounded } from '../../utils/money';

const ICONS = { duplicate: Copy, large: TrendingUp, 'new-merchant': Store };

export default function ThingsToCheck({ checks, openCount }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  // "Looks fine" dismisses every flag in the group; the page refreshes on its own afterwards.
  async function looksFine(check) {
    setBusy(check.id);
    setError('');
    try {
      for (const id of check.ids) await decideFlag(id, 'dismissed');
    } catch (err) {
      setError(err.message);
    }
    setBusy(null);
  }

  return (
    <section className="home-in space-y-3" style={{ '--delay': '660ms' }} aria-labelledby="checks">
      <div className="flex items-center justify-between">
        <h2 id="checks" className="text-[18px] font-semibold text-[#0b2545]">Things to check</h2>
        {openCount > 0 && <Link to="/flags" className="text-[14px] font-semibold text-[#1d4ed8] hover:underline">See all ({openCount})</Link>}
      </div>
      {checks.length === 0 ? (
        <p className="home-card p-5 flex items-center gap-2 text-[14px] text-slate-700"><CircleCheck size={18} className="text-emerald-600" aria-hidden="true" /> Nothing to check right now.</p>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {checks.map((c) => {
            const Icon = ICONS[c.type];
            return (
              <article key={c.id} className="home-card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-[#0b2545]">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center"><Icon size={16} aria-hidden="true" /></span>
                    {c.title}
                  </span>
                  <span className="tabular text-[15px] font-bold text-[#0b2545]" title={`Exact: ${exact(c.amount)}`}>{rounded(c.amount)}</span>
                </div>
                <p className="text-[13px] text-slate-600 line-clamp-2" title={c.reason}>
                  {c.merchant}{c.count > 1 ? ` · ${c.count} times` : ''} — {c.reason}
                </p>
                <div className="mt-auto flex gap-2 pt-1">
                  <Link to="/flags" state={{ type: c.type }} className="px-3 py-1.5 rounded-lg bg-[#1d4ed8] text-white text-[13px] font-semibold hover:bg-[#1e40af]">Review</Link>
                  <button type="button" disabled={busy === c.id} onClick={() => looksFine(c)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-[#0b2545] text-[13px] font-semibold hover:bg-slate-200 disabled:opacity-60">
                    Looks fine
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {error && <p role="alert" className="text-[13px] text-red-700">{error}</p>}
    </section>
  );
}
