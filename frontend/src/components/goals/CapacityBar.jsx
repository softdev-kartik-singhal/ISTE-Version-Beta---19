// "How much of a usual month your goals take": one stacked bar of each goal's monthly amount, the money left after them,
// and a marker for a low month. Plain-word legend underneath. Drawn for the dark hero.
import { exact } from '../../utils/money';

const COLORS = ['#93c5fd', '#67e8f9', '#a5b4fc', '#c4b5fd', '#7dd3fc'];

export default function CapacityBar({ goals, view }) {
  const live = goals.filter((g) => g.monthlyNow > 0);
  const scale = Math.max(view.usual, view.total) || 1;
  const left = view.usual - view.total;
  const pct = (v) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;
  const label = `${live.map((g) => `${g.name} ${exact(g.monthlyNow)}`).join(', ')}. ${left >= 0 ? `Left after goals ${exact(left)}` : `Short by ${exact(-left)}`}. Low month ${exact(view.low)}.`;

  return (
    <div className="mt-5">
      <div className="relative pt-5" role="img" aria-label={label}>
        <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[12px] text-blue-100" style={{ left: pct(view.low) }}>Low month {exact(view.low)}</span>
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-white/15">
          {live.map((g, i) => (
            <span key={g.id} title={`${g.name}: ${exact(g.monthlyNow)} a month`} style={{ width: pct(g.monthlyNow), background: COLORS[i % COLORS.length] }} className="h-full border-r border-[#0b2545]/40 last:border-r-0" />
          ))}
          {left > 0 && <span title={`Left after goals: ${exact(left)}`} style={{ width: pct(left) }} className="h-full bg-white/25" />}
        </div>
        <span className="absolute bottom-[-4px] h-6 w-[3px] -translate-x-1/2 rounded bg-white" style={{ left: pct(view.low) }} aria-hidden="true" />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-blue-50">
        {live.map((g, i) => (
          <li key={g.id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden="true" />
            {g.name} <strong className="font-semibold tabular-nums">{exact(g.monthlyNow)}</strong>
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/40" aria-hidden="true" />
          {left >= 0 ? 'Left after goals' : 'Short by'} <strong className="font-semibold tabular-nums">{exact(Math.abs(left))}</strong>
        </li>
      </ul>
    </div>
  );
}
