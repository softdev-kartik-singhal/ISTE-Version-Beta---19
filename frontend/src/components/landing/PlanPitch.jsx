// Plan section: goals, emergency fund and AI suggestions of product types (amounts are never shared with the AI).
import { Lightbulb, LifeBuoy, Target } from 'lucide-react';
import Reveal from './Reveal';
import { PHONE_SPACE } from './landingHooks';

const POINTS = [
  { icon: LifeBuoy, title: 'Emergency fund first', text: 'See how many months of essentials your cash covers, and when the fund will be full.' },
  { icon: Target, title: 'Goals with honest dates', text: 'Each goal is checked against what you really have left over each month.' },
  { icon: Lightbulb, title: 'Ideas, not sales', text: 'AI suggests types of products to look at. We never share your amounts with the AI.' },
];

export default function PlanPitch() {
  return (
    <section id="plan" data-screen="plan" className="py-24 bg-slate-50/70 scroll-mt-16">
      <div className={`max-w-7xl mx-auto px-5 lg:px-10 ${PHONE_SPACE}`}>
        <Reveal className="max-w-xl">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#1d4ed8]">Plan</p>
          <h2 className="mt-2 text-[34px] sm:text-[40px] leading-tight font-bold tracking-tight text-[#0b2545]">Know what to do with what’s left</h2>
        </Reveal>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {POINTS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 100} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <span className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center"><Icon size={22} /></span>
              <h3 className="mt-4 text-[17px] font-semibold text-[#0b2545]">{title}</h3>
              <p className="mt-1.5 text-[14px] text-slate-600">{text}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-slate-500">For learning only, not financial advice.</p>
      </div>
    </section>
  );
}
