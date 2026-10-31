// A ring that fills to the goal's percent (the number sits inside, the saved amount below), and the 25/50/75/100% track.
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { MILESTONES } from './goalKit';
import { exact, rounded } from '../../utils/money';

const SIZE = 132;
const STROKE = 11;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function ProgressRing({ percent, saved, color }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true)); // start empty, then fill
    return () => cancelAnimationFrame(frame);
  }, []);
  const shown = drawn ? Math.min(100, percent) : 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }} role="img" aria-label={`${Math.round(percent)}% saved`}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#e8edf5" strokeWidth={STROKE} />
          <circle
            className="ring-arc" cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - shown / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="tabular-nums text-[28px] font-extrabold text-[#0b2545]">{Math.round(percent)}%</span>
        </div>
      </div>
      <p className="mt-2 tabular-nums text-[15px] font-semibold text-[#0b2545]" title={`Exact: ${exact(saved)}`}>{rounded(saved)} <span className="font-normal text-slate-500">saved</span></p>
    </div>
  );
}

export function MilestoneTrack({ percent }) {
  return (
    <ol className="flex items-center w-full max-w-[15rem]" aria-label="Milestones">
      {MILESTONES.map((m, i) => {
        const lit = percent >= m;
        return (
          <li key={m} className={`flex items-center ${i < MILESTONES.length - 1 ? 'flex-1' : ''}`}>
            <span className="flex flex-col items-center gap-1">
              <span className={`milestone-dot w-[22px] h-[22px] rounded-full flex items-center justify-center ${lit ? 'is-lit bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {lit ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : null}
              </span>
              <span className={`text-[11px] ${lit ? 'font-semibold text-emerald-800' : 'text-slate-500'}`}>{m}%<span className="sr-only">{lit ? ' reached' : ' not reached yet'}</span></span>
            </span>
            {i < MILESTONES.length - 1 && <span className={`h-[3px] flex-1 mx-1 mb-4 rounded ${percent >= MILESTONES[i + 1] ? 'bg-emerald-500' : percent > m ? 'bg-emerald-300' : 'bg-slate-200'}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
