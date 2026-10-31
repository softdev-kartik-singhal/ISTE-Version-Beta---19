// Phone screen for the hero: a question types itself, three checks tick, then the verdict appears. Sample data.
import { useEffect, useState } from 'react';
import { Check, CircleAlert, Loader2, Sparkles } from 'lucide-react';
import { useReducedMotion } from '../landingHooks';

const QUESTION = 'Can I afford an ₹80,000 phone next month?';
const STAGES = ['Reading your statements', 'Checking upcoming payments', 'Calculating your answer'];

export default function AskScreen() {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(reduced ? QUESTION.length : 0);
  const [done, setDone] = useState(reduced ? STAGES.length : 0); // how many checks have ticked
  const typing = typed < QUESTION.length;

  useEffect(() => {
    if (reduced) return undefined;
    if (typing) {
      const t = setTimeout(() => setTyped((n) => n + 1), 38);
      return () => clearTimeout(t);
    }
    if (done < STAGES.length) {
      const t = setTimeout(() => setDone((n) => n + 1), 550);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [typed, done, typing, reduced]);

  return (
    <div className="flex flex-col gap-3 text-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
        <Sparkles size={12} className="text-[#1d4ed8]" /> Ask
      </p>
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-3 text-[13px] leading-snug min-h-[58px]">
        <span className={typing ? 'caret' : ''}>{QUESTION.slice(0, typed)}</span>
      </div>
      <ul className="space-y-1.5">
        {STAGES.map((stage, i) => {
          const ticked = i < done;
          const running = !typing && i === done;
          if (typing || i > done) return null;
          return (
            <li key={stage} className="pop-in flex items-center gap-2 text-[12px] text-slate-700">
              {ticked ? (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check size={11} strokeWidth={3} />
                </span>
              ) : (
                running && <Loader2 size={16} className="text-[#1d4ed8] animate-spin" />
              )}
              {stage}
            </li>
          );
        })}
      </ul>
      {done === STAGES.length && (
        <div className="pop-in rounded-2xl bg-white shadow-md border border-slate-200 p-3 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[12px] font-semibold">
            <CircleAlert size={14} /> Only if your income is normal
          </span>
          <p className="text-[12px] text-slate-600">If income is low you&apos;d be ₹6,200 short after bills.</p>
          <p className="text-[12px] font-medium text-slate-900">Waiting until January makes it a Yes.</p>
        </div>
      )}
    </div>
  );
}
