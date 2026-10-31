// Tiny decorative trend line (or bars) under a key number; the number itself carries the meaning.

export default function Sparkline({ values, bars = false, color = '#1d4ed8' }) {
  if (!values || values.length < 2) return <div className="h-8" aria-hidden="true" />;
  const w = 100;
  const h = 32;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const y = (v) => h - 2 - ((v - min) / (max - min || 1)) * (h - 4);
  if (bars) {
    const bw = w / values.length;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none" aria-hidden="true">
        {values.map((v, i) => (
          <rect key={i} x={i * bw + bw * 0.2} width={bw * 0.6} y={y(v)} height={h - y(v)} rx="2" fill={color} opacity="0.35" />
        ))}
      </svg>
    );
  }
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={`0,${h} ${points} ${w},${h}`} fill={color} opacity="0.08" stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
