// Landing hero: headline, subline, primary CTAs and the no-credentials guarantee pill.
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CirclePlay } from 'lucide-react';

export default function HeroSection({ onSeeDemo }) {
  return (
    <section className="relative overflow-hidden px-6 lg:px-12 py-space-2xl bg-surface">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-b from-primary-fixed/40 via-surface-container-high/30 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-high shadow-sm mb-space-lg">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-label-md text-label-md text-primary font-semibold tracking-wide uppercase">Private Decision Intelligence for Salaried + Freelancers</span>
        </div>
        <h1 className="max-w-4xl font-display-lg text-display-lg lg:text-[44px] lg:leading-[52px] font-bold text-on-surface tracking-tight mb-space-md">
          Know if you can afford it - <br className="hidden sm:inline" />
          <span className="text-primary-container">before you spend</span>
        </h1>
        <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant mb-space-xl">
          SmartGullak combines all your bank statements and shows every step of its answer. No black boxes, no credit card pushes, zero data monetisation.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-space-md mb-space-lg w-full sm:w-auto">
          <Link
            className="w-full sm:w-auto px-space-xl py-3 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold transition-all shadow-md flex items-center justify-center gap-space-sm"
            to="/signup"
          >
            <span>Try the Cashflow Engine</span>
            <ArrowRight size={20} />
          </Link>
          <button
            className="w-full sm:w-auto px-space-lg py-3 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-headline-sm text-headline-sm font-medium transition-all shadow-sm flex items-center justify-center gap-space-sm"
            onClick={onSeeDemo}
          >
            <CirclePlay size={20} className="text-primary" />
            <span>See Sample Decision Waterfall</span>
          </button>
        </div>
        <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-low text-on-surface-variant">
          <BadgeCheck size={18} className="text-primary" />
          <span className="font-label-sm text-label-sm font-medium">Zero bank credentials required. We ingest statements offline.</span>
        </div>
      </div>
    </section>
  );
}
