// The surplus as a stream: one pipe that splits into two channels (emergency fund / long-term goals). Channel width follows
// the split; dots flow along each channel (none with reduced motion, and none in a channel that is switched off).
// Drawn twice: left to right on wide screens, top to bottom on phones.
import { useReducedMotion } from '../../hooks/useMotion';

const width = (pct) => (pct <= 0 ? 3 : 8 + (pct / 100) * 34); // px: a thin line at 0%, a wide channel at 100%
const dotCount = (pct) => (pct <= 0 ? 0 : Math.round(2 + (pct / 100) * 5));

function Dots({ path, n, color, still }) {
  if (still) return null;
  return Array.from({ length: n }, (_, i) => (
    <circle key={i} r="4.5" fill={color}>
      <animateMotion dur="3s" repeatCount="indefinite" begin={`${-(i * 3) / n}s`} path={path} />
    </circle>
  ));
}

function Pipes({ box, source, top, bottom, topPct, bottomPct, still, tick, complete }) {
  return (
    <svg viewBox={box} className="h-full w-full" role="img" aria-label={`Your monthly surplus splits ${topPct}% to the emergency fund and ${bottomPct}% to long-term goals`}>
      <path d={source} fill="none" stroke="#bfd3fb" strokeWidth="44" />
      <path d={top} fill="none" stroke={topPct > 0 ? '#1d4ed8' : '#cbd5e1'} strokeOpacity={topPct > 0 ? 0.9 : 1} strokeDasharray={topPct > 0 ? undefined : '6 6'} style={{ strokeWidth: width(topPct), transition: 'stroke-width 300ms ease' }} />
      <path d={bottom} fill="none" stroke="#0891b2" strokeOpacity="0.9" style={{ strokeWidth: width(bottomPct), transition: 'stroke-width 300ms ease' }} />
      {complete && (
        <g transform={`translate(${tick[0]} ${tick[1]})`} aria-hidden="true">
          <circle r="15" fill="#059669" /><path d="M-6 0 L-1.5 5 L7 -5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      <Dots path={source} n={3} color="#1d4ed8" still={still} />
      <Dots path={top} n={dotCount(topPct)} color="#fff" still={still} />
      <Dots path={bottom} n={dotCount(bottomPct)} color="#fff" still={still} />
    </svg>
  );
}

export default function Stream({ topPct, bottomPct, complete }) {
  const still = useReducedMotion();
  return (
    <>
      <div className="hidden h-[300px] md:block">
        <Pipes
          box="0 0 560 300" still={still} topPct={topPct} bottomPct={bottomPct} complete={complete} tick={[536, 75]}
          source="M0,150 L190,150" top="M190,150 C290,150 290,75 400,75 L560,75" bottom="M190,150 C290,150 290,225 400,225 L560,225"
        />
      </div>
      <div className="mx-auto h-[300px] max-w-[320px] md:hidden">
        <Pipes
          box="0 0 320 300" still={still} topPct={topPct} bottomPct={bottomPct} complete={complete} tick={[80, 280]}
          source="M160,0 L160,100" top="M160,100 C160,170 80,150 80,215 L80,300" bottom="M160,100 C160,170 240,150 240,215 L240,300"
        />
      </div>
    </>
  );
}
