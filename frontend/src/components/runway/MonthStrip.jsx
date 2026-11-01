// A horizontal strip of month tiles (jars), the spine of the whole page. It scrolls sideways on phones.
// Markers hang off it in two lanes (above and below the jars) so their labels never overlap each other:
//   marker = { id, at: months from now, label, lane: 'top' | 'bottom', dashed? , tone }
// Labels glide when `at` changes; `glow: true` gives a marker a soft blue glow (the runway figure). A label near the right edge flips to the left of its line so it never leaves the strip.
import Jar from './Jar';
import { monthTile } from './runwayKit';

export const TILE = 56;       // width of one month tile, px
const LANE = 44;              // height of each label lane, px
const JAR_H = 54;             // height of a jar, px
const LABEL_W = 210;          // room a label may need, px

const TONE_TEXT = { blue: 'bg-[#0b2545] text-white', green: 'bg-emerald-700 text-white', slate: 'bg-white text-[#0b2545] border border-slate-300', amber: 'bg-amber-100 text-amber-900' };

function Marker({ m, total }) {
  const x = Math.max(0, Math.min(total, m.at * TILE));
  const flip = x > total - LABEL_W;
  const top = m.lane === 'top';
  return (
    <>
      {/* the line runs through the jars only, so it never crosses the month names under them */}
      <span className="strip-label absolute z-10 w-0" style={{ top: LANE - 2, height: JAR_H + 4, transform: `translateX(${x}px)` }} aria-hidden="true">
        <span className={`absolute inset-y-0 left-[-1px] w-[2px] ${m.dashed ? 'border-l-2 border-dashed border-emerald-600' : 'bg-[#0b2545]'}`} />
      </span>
      <span className="strip-label absolute z-20 h-8 w-0" style={{ [top ? 'top' : 'bottom']: 2, transform: `translateX(${x}px)` }}>
        <span className={`absolute top-0 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-semibold leading-6 shadow-sm ${TONE_TEXT[m.tone || 'blue']} ${m.glow ? 'marker-glow' : ''} ${flip ? 'right-0' : 'left-0'}`}>{m.label}</span>
      </span>
    </>
  );
}

export default function MonthStrip({ count, jars, markers = [], zone, ariaLabel }) {
  const total = count * TILE;
  return (
    <div className="strip-scroll -mx-4 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0" role="group" aria-label={ariaLabel} tabIndex={0}>
      <div className="relative" style={{ width: total, paddingTop: LANE, paddingBottom: LANE }}>
        {zone && (
          <div className="absolute z-0 flex flex-col items-start" style={{ top: 2, left: 0, width: zone.to * TILE }}>
            <span className="mb-1 flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-[#1d4ed8]">{zone.label}</span>
            <span className="h-[6px] w-full rounded-full bg-[#1d4ed8]/25"><span className="block h-full rounded-full bg-[#1d4ed8]" style={{ width: `${zone.progress * 100}%`, transition: 'width 520ms ease' }} /></span>
          </div>
        )}
        <div className="relative z-0 flex">
          {Array.from({ length: count }, (_, i) => {
            const t = monthTile(i);
            const j = jars[i] || { fill: 0 };
            return (
              <div key={i} className="strip-tile flex shrink-0 flex-col items-center" style={{ width: TILE }}>
                <Jar index={i} fill={j.fill} extra={j.extra} tone={j.tone} ring={j.ring} />
                <span className="mt-1 text-[12px] font-semibold text-[#0b2545]">{t.short}</span>
                <span className="text-[11px] text-slate-500">{i + 1}</span>
              </div>
            );
          })}
        </div>
        {markers.map((m) => <Marker key={m.id} m={m} total={total} />)}
      </div>
    </div>
  );
}
