// Shown only when the statements hold a one-off income (like a yearly bonus) that is left out of the forecast.
// "Include bonus" shows the answer with it, and the answer's range bar then shows both.
import { Gift } from 'lucide-react';
import { exact, rounded } from '../../utils/money';

export default function BonusCard({ bonus, included, onToggle }) {
  return (
    <section className="ask-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p className="flex items-start gap-3 text-[15px] text-slate-700">
        <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0"><Gift size={20} aria-hidden="true" /></span>
        <span className="pt-1.5">
          Last year&apos;s bonus (<strong title={`Exact: ${exact(bonus.amount)}`}>{rounded(bonus.amount)}</strong> in {bonus.monthShort}) hasn&apos;t arrived this year, so we left it out.
        </span>
      </p>
      <label className="inline-flex items-center gap-3 cursor-pointer select-none shrink-0">
        <span className="text-[14px] font-semibold text-[#0b2545]">Include bonus</span>
        <button type="button" role="switch" aria-checked={included} onClick={onToggle}
          className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] ${included ? 'bg-[#1d4ed8]' : 'bg-slate-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${included ? 'translate-x-5' : ''}`} />
          <span className="sr-only">{included ? 'Bonus included' : 'Bonus left out'}</span>
        </button>
      </label>
    </section>
  );
}
