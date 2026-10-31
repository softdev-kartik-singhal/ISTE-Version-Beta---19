// Hero ring: how much of a usual month's spending is used so far, with money left counting up in the centre.
import { useEffect, useState } from 'react';
import { useCountUp, useReducedMotion } from '../../hooks/useMotion';
import { exact, rounded } from '../../utils/money';

export default function SpentRing({ spentPct, moneyLeft, daysLeft, spent, usualSpend }) {
  const reduced = useReducedMotion();
  const [filled, setFilled] = useState(reduced);
  const left = useCountUp(moneyLeft, true, 1100);
  useEffect(() => {
    const t = setTimeout(() => setFilled(true), 150); // paint empty first so the ring visibly fills
    return () => clearTimeout(t);
  }, []);

  const pct = spentPct ?? 0;
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const shown = Math.min(100, pct);
  const label = spentPct == null
    ? `${rounded(moneyLeft)} left`
    : `${pct}% of usual spending used, ${daysLeft} days left. ${rounded(moneyLeft)} left.`;

  return (
    <figure className="flex flex-col items-center gap-2" aria-label={label}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round"
            stroke={pct > 100 ? '#fca5a5' : '#93c5fd'} className="ring-fill"
            strokeDasharray={c} strokeDashoffset={filled ? c * (1 - shown / 100) : c} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center" title={`Exact: ${exact(moneyLeft)}`}>
          <span className="tabular text-[30px] font-extrabold tracking-tight leading-none">{rounded(left)}</span>
          <span className="mt-1 text-[12px] text-blue-100">left this month</span>
        </div>
      </div>
      {spentPct != null && (
        <figcaption className="text-[13px] text-blue-100 text-center" title={`Spent ${exact(spent)} of a usual ${exact(usualSpend)}`}>
          <strong className="text-white">{pct}%</strong> of usual spending used · {daysLeft} days left
        </figcaption>
      )}
    </figure>
  );
}
