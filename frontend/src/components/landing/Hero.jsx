// Hero: badge, headline, one-line pitch, Get started / Try the demo, and trust chips.
// The phone preview is rendered here: fixed on the right on desktop, and under the text below 1024px (see landing.css).
import { Link } from 'react-router-dom';
import { ArrowRight, FileX2, ListChecks, Loader2, ShieldCheck } from 'lucide-react';
import { PHONE_SPACE } from './landingHooks';

const TRUST = [
  { icon: ListChecks, text: 'Every answer explained' },
  { icon: FileX2, text: 'Statement files deleted after reading' },
  { icon: ShieldCheck, text: 'Card + password for sensitive actions' },
];

// onDemo: signs into the demo account; demoBusy: show a spinner while that happens; phone: the PhoneMockup element
export default function Hero({ onDemo, demoBusy, phone }) {
  return (
    <section id="top" data-screen="ask" className="relative overflow-hidden pt-28 pb-16 lg:min-h-screen lg:flex lg:items-center">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#eef3ff] via-white to-white" aria-hidden="true" />
      <div className="hero-mesh absolute -inset-[10%] pointer-events-none" aria-hidden="true" />
      <div className="hero-dots absolute inset-0 pointer-events-none" aria-hidden="true" />
      {/* content is relative so it paints above the background layers; no stacking context, so the fixed phone stays on top of later sections */}
      <div className={`relative w-full max-w-7xl mx-auto px-5 lg:px-10 ${PHONE_SPACE}`}>
        <div className="max-w-2xl">
          <span className="reveal is-visible inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-blue-100 text-[13px] font-medium text-[#0b2545] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" /> For salaried people and freelancers
          </span>
          <h1 className="mt-5 text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.05] font-extrabold tracking-tight text-[#0b2545]">
            Know if you can afford it — <span className="text-gradient">before you spend</span>
          </h1>
          <p className="mt-5 text-[18px] leading-relaxed text-slate-600 max-w-xl">
            SmartGullak reads all your bank statements and shows every step of its answer.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/signup" className="lift inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1d4ed8] text-white text-[16px] font-semibold shadow-lg shadow-blue-600/30 hover:bg-[#1e40af]">
              Get started free <ArrowRight size={18} />
            </Link>
            <button type="button" onClick={onDemo} disabled={demoBusy} className="lift inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0b2545] text-[16px] font-semibold border border-slate-200 shadow-sm hover:border-[#1d4ed8] disabled:opacity-70">
              {demoBusy && <Loader2 size={18} className="animate-spin" />} Try the demo
            </button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200 text-[13px] text-slate-700">
                <Icon size={15} className="text-[#1d4ed8]" /> {text}
              </li>
            ))}
          </ul>
        </div>
        {phone}
      </div>
    </section>
  );
}
