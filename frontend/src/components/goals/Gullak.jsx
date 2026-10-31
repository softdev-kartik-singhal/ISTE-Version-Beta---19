// A piggy-bank gullak that fills with coins up to `percent`, with a coin dropping into its slot now and then.
// Drawn for a dark background (white outline); the fill is a transform, so it animates smoothly and respects reduced motion.
import { useEffect, useId, useState } from 'react';

const BOTTOM = 168; // y of the bottom of the body; the fill grows upward from here
const BODY_H = 124;

export default function Gullak({ percent, className = '', dropping = true }) {
  const id = useId().replace(/:/g, '');
  // Anything saved shows as a visible pile of coins: the fill runs from 12% (some saved) to 100% (done). The label keeps the true percent.
  const target = percent > 0 ? 0.12 + 0.88 * (Math.min(100, percent) / 100) : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(target)); // start empty, then fill
    return () => cancelAnimationFrame(frame);
  }, [target]);
  const fill = { transformOrigin: `0px ${BOTTOM}px`, transform: `scaleY(${shown})` };

  return (
    <svg viewBox="0 0 260 210" className={className} role="img" aria-label={`Gullak ${Math.round(percent)}% full`}>
      <defs>
        <clipPath id={`body-${id}`}><ellipse cx="128" cy="106" rx="84" ry="62" /></clipPath>
        <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <pattern id={`coins-${id}`} width="22" height="16" patternUnits="userSpaceOnUse">
          <ellipse cx="11" cy="8" rx="8.5" ry="5.5" fill="none" stroke="#b45309" strokeOpacity="0.45" strokeWidth="1.4" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="198" rx="78" ry="7" fill="#000" opacity="0.18" />
      <rect x="82" y="150" width="24" height="40" rx="9" fill="#fff" fillOpacity="0.16" stroke="#fff" strokeWidth="2.5" />
      <rect x="152" y="150" width="24" height="40" rx="9" fill="#fff" fillOpacity="0.16" stroke="#fff" strokeWidth="2.5" />
      <path d="M46 100 C24 94 24 70 40 68" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M148 52 L172 26 L184 64 Z" fill="#fff" fillOpacity="0.2" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="128" cy="106" rx="84" ry="62" fill="#fff" fillOpacity="0.12" />
      <g clipPath={`url(#body-${id})`}>
        <g className="gullak-fill" style={fill}>
          <rect x="40" y={BOTTOM - BODY_H} width="176" height={BODY_H} fill={`url(#gold-${id})`} />
          <rect x="40" y={BOTTOM - BODY_H} width="176" height={BODY_H} fill={`url(#coins-${id})`} />
        </g>
      </g>
      <ellipse cx="128" cy="106" rx="84" ry="62" fill="none" stroke="#fff" strokeWidth="3" />
      <rect x="202" y="90" width="36" height="30" rx="14" fill="#fff" fillOpacity="0.2" stroke="#fff" strokeWidth="2.5" />
      <circle cx="214" cy="105" r="2.8" fill="#fff" /><circle cx="226" cy="105" r="2.8" fill="#fff" />
      <circle cx="178" cy="88" r="4.5" fill="#fff" />
      <rect x="108" y="43" width="44" height="8" rx="4" fill="#0b2545" stroke="#fff" strokeWidth="2" />
      {dropping && (
        <g className="gullak-coin">
          <circle cx="130" cy="12" r="10" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
          <text x="130" y="16.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#92400e">₹</text>
        </g>
      )}
    </svg>
  );
}
