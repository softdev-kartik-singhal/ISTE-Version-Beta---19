// One month as a small jar. `fill` (0..1) is how full it is; `extra` (0..1) stacks a second colour on top
// (money that stopping things would add). The fill is a transform, so it moves smoothly and can be switched off.
import { useEffect, useId, useState } from 'react';

const TONES = {
  target: ['#60a5fa', '#1d4ed8'], extra: ['#67e8f9', '#0891b2'], spend: ['#93c5fd', '#1d4ed8'], gain: ['#6ee7b7', '#059669'],
};
const BOTTOM = 50;
const BODY_H = 38;

export default function Jar({ fill, extra = 0, tone = 'spend', index = 0, ring = false }) {
  const id = useId().replace(/:/g, '');
  const [on, setOn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setOn(true)); // start empty, then fill in sequence
    return () => cancelAnimationFrame(frame);
  }, []);
  const delay = `${Math.min(index * 28, 420)}ms`;
  const [light, dark] = TONES[tone];
  const [gLight, gDark] = TONES.gain;
  const style = (f) => ({ transformOrigin: `0px ${BOTTOM}px`, transform: `scaleY(${on ? f : 0})`, transitionDelay: delay });
  return (
    <svg viewBox="0 0 40 54" className="h-[54px] w-10" aria-hidden="true">
      <defs>
        <clipPath id={`jar-${id}`}><path d="M8 12 Q4 14 4 22 L4 44 Q4 50 10 50 L30 50 Q36 50 36 44 L36 22 Q36 14 32 12 Z" /></clipPath>
        <linearGradient id={`a-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={light} /><stop offset="1" stopColor={dark} /></linearGradient>
        <linearGradient id={`b-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={gLight} /><stop offset="1" stopColor={gDark} /></linearGradient>
      </defs>
      <path d="M8 12 Q4 14 4 22 L4 44 Q4 50 10 50 L30 50 Q36 50 36 44 L36 22 Q36 14 32 12 Z" fill="#f1f5fb" />
      <g clipPath={`url(#jar-${id})`}>
        {extra > 0 && (
          <g className="jar-fill" style={style(fill + extra)}>
            <rect x="0" y={BOTTOM - BODY_H} width="40" height={BODY_H} fill={`url(#b-${id})`} />
          </g>
        )}
        <g className="jar-fill" style={style(fill)}>
          <rect x="0" y={BOTTOM - BODY_H} width="40" height={BODY_H} fill={`url(#a-${id})`} />
        </g>
      </g>
      <path d="M8 12 Q4 14 4 22 L4 44 Q4 50 10 50 L30 50 Q36 50 36 44 L36 22 Q36 14 32 12 Z" fill="none" stroke={ring ? '#1d4ed8' : '#b6c2d6'} strokeWidth={ring ? 2 : 1.5} />
      <rect x="12" y="6" width="16" height="7" rx="2.5" fill="#fff" stroke={ring ? '#1d4ed8' : '#b6c2d6'} strokeWidth={ring ? 2 : 1.5} />
    </svg>
  );
}
