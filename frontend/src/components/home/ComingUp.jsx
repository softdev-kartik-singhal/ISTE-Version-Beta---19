// "Coming up": the next regular payments as stops on a horizontal line, each with a date bubble. Scrolls sideways on phones.
import { iconFor } from '../../utils/icons';
import { exact, rounded } from '../../utils/money';

export default function ComingUp({ items }) {
  return (
    <section className="home-card home-in p-5 sm:p-6" style={{ '--delay': '300ms' }} aria-labelledby="coming-up">
      <h2 id="coming-up" className="text-[18px] font-semibold text-[#0b2545]">Coming up</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-[14px] text-slate-600">No regular payments due in the next 7 days.</p>
      ) : (
        <ol className="no-scrollbar mt-5 flex gap-4 overflow-x-auto pb-1 relative">
          {/* the line the stops sit on */}
          <span className="absolute left-0 right-0 top-[22px] h-[2px] bg-gradient-to-r from-[#1d4ed8]/40 via-slate-200 to-transparent" aria-hidden="true" />
          {items.map((p) => {
            const Icon = iconFor(p.icon);
            return (
              <li key={p.id} className="relative shrink-0 w-[190px] flex flex-col items-start gap-3">
                <span className="relative z-10 flex flex-col items-center justify-center w-11 h-11 rounded-full bg-[#0b2545] text-white leading-none shadow-md" aria-label={`Due ${p.date}`}>
                  <span className="text-[10px] uppercase text-blue-200">{p.weekday}</span>
                  <span className="text-[14px] font-bold">{p.day}</span>
                </span>
                <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white text-[#1d4ed8] flex items-center justify-center shadow-sm"><Icon size={16} aria-hidden="true" /></span>
                    <span className="text-[14px] font-semibold text-[#0b2545] truncate">{p.name}</span>
                  </div>
                  <p className="mt-2 tabular text-[18px] font-bold text-[#0b2545]" title={`Exact: ${exact(p.amount)}`}>{rounded(p.amount)}</p>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-white text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">{p.kind} · {p.weekday}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
