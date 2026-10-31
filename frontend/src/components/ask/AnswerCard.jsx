// The centrepiece: verdict badge, plain headline, one sentence, a count-up number, the range bar, how sure we are,
// and one "what would change this" line. A light tint matches the verdict (always with icon + words).
// A subtle confetti burst fires once per question, only for "Yes, comfortably".
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Lightbulb } from 'lucide-react';
import VerdictBadge from '../ui/VerdictBadge';
import RangeBar from './RangeBar';
import ConfidenceMeter from './ConfidenceMeter';
import { useCountUp, useReducedMotion } from '../../hooks/useMotion';
import { exact, shortRupees } from '../../utils/money';

const TINT = {
  yes: 'from-emerald-50 via-white to-white border-emerald-200',
  typical: 'from-amber-50 via-white to-white border-amber-200',
  no: 'from-red-50 via-white to-white border-red-200',
};

const celebrated = new Set(); // questions that already had their confetti

// view: toAskView(); ghost: optional "without the bonus" values shown as hollow markers; celebrateKey: one per question
export default function AnswerCard({ view, ghost, ghostLabel, celebrateKey }) {
  const reduced = useReducedMotion();
  const usual = view.left.typical;
  const counted = useCountUp(Math.round(Math.abs(usual)), true, 900);

  useEffect(() => {
    if (view.state !== 'yes' || reduced || celebrated.has(celebrateKey)) return;
    celebrated.add(celebrateKey);
    try {
      confetti({ particleCount: 50, spread: 60, startVelocity: 28, ticks: 110, origin: { y: 0.35 }, scalar: 0.8, zIndex: 50 });
    } catch {
      /* confetti is decoration only */
    }
  }, [view.state, reduced, celebrateKey]);

  return (
    <section data-tour="verdict" className={`ask-pop rounded-[20px] border bg-gradient-to-br p-5 sm:p-7 shadow-[0_18px_40px_-20px_rgba(11,37,69,0.25)] space-y-5 ${TINT[view.state]}`}>
      <div aria-live="polite" className="space-y-3">
        <VerdictBadge state={view.state} size="lg" />
        <h2 className="text-[24px] sm:text-[30px] font-bold leading-tight tracking-tight text-[#0b2545]">{view.headline}</h2>
        <p className="text-[16px] text-slate-700 max-w-2xl">{view.sentence}</p>
        <p className="flex items-baseline gap-2" title={`Exact: ${exact(usual)}`}>
          <span className="tabular text-[34px] font-extrabold tracking-tight text-[#0b2545]">{usual < 0 ? '−' : ''}{shortRupees(counted)}</span>
          <span className="text-[14px] text-slate-600">{usual < 0 ? 'short in a usual month' : 'left in a usual month, after everything'}</span>
        </p>
      </div>
      <RangeBar values={view.left} ghost={ghost} ghostLabel={ghostLabel} />
      <ConfidenceMeter confidence={view.confidence} />
      <p className="flex items-start gap-2 text-[15px] font-medium text-[#0b2545] bg-white/70 rounded-xl px-4 py-3 border border-slate-200">
        <Lightbulb size={18} className="text-[#1d4ed8] mt-0.5 shrink-0" aria-hidden="true" />
        <span><span className="text-slate-600 font-normal">What would change this: </span>{view.change}</span>
      </p>
    </section>
  );
}
