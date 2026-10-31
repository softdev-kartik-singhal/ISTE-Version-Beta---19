// The short (about 1.1s) loader shown while the answer is worked out: three real steps tick in one after another.
import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useMotion';

const STAGES = ['Reading your statements', 'Checking upcoming payments', 'Calculating your answer'];

export default function StageLoader() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(reduced ? STAGES.length : 0);
  useEffect(() => {
    if (reduced) return undefined;
    const timers = [setTimeout(() => setStage(1), 370), setTimeout(() => setStage(2), 740)];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  return (
    <div className="ask-card ask-pop p-6" role="status" aria-live="polite" aria-label="Working out your answer">
      <ul className="space-y-2.5">
        {STAGES.map((s, i) => {
          if (i > stage && !reduced) return null;
          const done = i < stage;
          return (
            <li key={s} className="ask-step flex items-center gap-2.5 text-[15px] text-slate-700">
              {done ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check size={13} strokeWidth={3} aria-hidden="true" /></span>
              ) : (
                <Loader2 size={20} className="text-[#1d4ed8] animate-spin motion-reduce:animate-none" aria-hidden="true" />
              )}
              {s}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
