// Final call to action: a rounded gradient band with Get started free / Try the demo.
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Reveal from './Reveal';

export default function FinalCTA({ onDemo, demoBusy }) {
  return (
    <section className="py-20 px-5 lg:px-10">
      <Reveal className="relative max-w-6xl mx-auto overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0b2545] via-[#12357a] to-[#1d4ed8] px-6 py-16 sm:px-14 text-center text-white shadow-2xl">
        <div className="hero-dots absolute inset-0 opacity-20" aria-hidden="true" />
        <h2 className="relative text-[32px] sm:text-[44px] leading-tight font-bold tracking-tight max-w-2xl mx-auto">Make your next big purchase with confidence</h2>
        <div className="relative mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/signup" className="lift inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0b2545] text-[16px] font-semibold shadow-lg">
            Get started free <ArrowRight size={18} />
          </Link>
          <button type="button" onClick={onDemo} disabled={demoBusy} className="lift inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/40 text-white text-[16px] font-semibold hover:bg-white/10 disabled:opacity-70">
            {demoBusy && <Loader2 size={18} className="animate-spin" />} Try the demo
          </button>
        </div>
      </Reveal>
    </section>
  );
}
