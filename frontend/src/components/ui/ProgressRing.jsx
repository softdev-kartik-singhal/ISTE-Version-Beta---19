// Circular progress with the percentage written inside (so it never relies on colour alone).

export default function ProgressRing({ percent, size = 72, label }) {
  const p = Math.max(0, Math.min(100, percent));
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(p)}% done`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-surface-container-high" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={p >= 100 ? 'stroke-emerald-500' : 'stroke-primary-container'}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - p / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-label-md text-label-md font-semibold text-on-surface">{Math.round(p)}%</span>
    </div>
  );
}
