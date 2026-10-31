// The answer as a picture: a bar from a bad month to a good month with three markers, and the safety-cushion zone
// shaded on the left (a marker inside it means the cushion would be used). Markers slide into place.
// Horizontal on wider screens, vertical on small phones. `ghost` shows the "before" values as hollow markers.
import { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useMotion';
import { exact, shortRupees } from '../../utils/money';

const MARKERS = [
  { key: 'worst', label: 'Bad month', dot: 'bg-red-500', ring: 'border-red-500' },
  { key: 'typical', label: 'Usual', dot: 'bg-[#1d4ed8]', ring: 'border-[#1d4ed8]' },
  { key: 'best', label: 'Good month', dot: 'bg-emerald-500', ring: 'border-emerald-500' },
];

export default function RangeBar({ values, ghost = null, ghostLabel = 'Before' }) {
  const reduced = useReducedMotion();
  const [placed, setPlaced] = useState(reduced);
  useEffect(() => {
    const t = setTimeout(() => setPlaced(true), 60); // paint at the start first so the markers visibly slide
    return () => clearTimeout(t);
  }, []);

  const all = [...Object.values(values), ...(ghost ? Object.values(ghost) : []), 0];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = Math.max((max - min) * 0.12, 1);
  const lo = min - pad;
  const hi = max + pad;
  const pos = (v) => ((v - lo) / (hi - lo)) * 100;
  const zero = pos(0);
  const at = (v) => (placed ? pos(v) : zero);
  const worstAt = at(values.worst);
  const spanAt = at(values.best) - worstAt;

  const marker = (m, v, hollow, vertical) => {
    const style = vertical
      ? { bottom: `${at(v)}%`, left: '50%', transform: 'translate(-50%, 50%)' }
      : { left: `${at(v)}%`, top: '50%', transform: 'translate(-50%, -50%)' };
    return (
      <span
        key={`${m.key}-${hollow ? 'g' : 'v'}`}
        title={`${hollow ? ghostLabel : m.label}: ${exact(v)}`}
        style={style}
        className={`rb-move absolute w-[18px] h-[18px] rounded-full border-[3px] ${hollow ? `bg-white ${m.ring} opacity-60` : `${m.dot} border-white shadow-md`}`}
      />
    );
  };

  return (
    <div role="img" aria-label={`Left after this purchase: ${MARKERS.map((m) => `${m.label} ${exact(values[m.key])}`).join(', ')}`}>
      {/* horizontal */}
      <div className="hidden sm:block pt-5">
        <div className="relative h-10">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-slate-200/80" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3 rounded-l-full bg-red-200" style={{ width: `${zero}%` }} />
          <span className="absolute -top-5 left-0 text-[11px] font-medium text-red-800">Safety cushion</span>
          <div className="rb-move absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-gradient-to-r from-blue-200 to-blue-500/80" style={{ left: `${worstAt}%`, width: `${Math.max(spanAt, 0)}%` }} />
          {ghost && MARKERS.map((m) => marker(m, ghost[m.key], true, false))}
          {MARKERS.map((m) => marker(m, values[m.key], false, false))}
        </div>
      </div>
      {/* vertical, for small phones */}
      <div className="sm:hidden flex gap-5 items-stretch">
        <div className="relative w-4 h-48 shrink-0">
          <div className="absolute inset-0 rounded-full bg-slate-200/80" />
          <div className="absolute bottom-0 inset-x-0 rounded-b-full bg-red-200" style={{ height: `${zero}%` }} />
          <div className="rb-move absolute inset-x-0 rounded-full bg-gradient-to-t from-blue-200 to-blue-500/80" style={{ bottom: `${worstAt}%`, height: `${Math.max(spanAt, 0)}%` }} />
          {ghost && MARKERS.map((m) => marker(m, ghost[m.key], true, true))}
          {MARKERS.map((m) => marker(m, values[m.key], false, true))}
        </div>
        <p className="self-end text-[11px] font-medium text-red-800">Safety cushion zone</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
        {MARKERS.map((m) => (
          <li key={m.key} className="flex items-center gap-1.5 text-slate-700">
            <span className={`w-3 h-3 rounded-full ${m.dot}`} aria-hidden="true" />
            {m.label} <strong className="tabular text-[#0b2545]" title={exact(values[m.key])}>{shortRupees(values[m.key])}</strong>
            {ghost && <span className="text-slate-500">(was <span title={exact(ghost[m.key])}>{shortRupees(ghost[m.key])}</span>)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
