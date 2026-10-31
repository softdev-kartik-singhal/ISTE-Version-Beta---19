// Features: a bento grid of six cards, each with a small CSS/SVG visual. Cards lean toward the cursor on desktop.
import { CircleCheck, CircleX, CircleAlert, Link2, ShieldCheck, Wallet } from 'lucide-react';
import Reveal from './Reveal';
import { PHONE_SPACE, inr, useCountUp, useInView, useReducedMotion } from './landingHooks';

// ---- mini visuals (sample numbers only) ----

function VerdictCases() {
  const cases = [
    { label: 'If income is low', icon: CircleX, cls: 'bg-red-50 text-red-800', note: '₹6,200 short' },
    { label: 'If income is normal', icon: CircleAlert, cls: 'bg-amber-50 text-amber-900', note: '₹18,400 left' },
    { label: 'If income is high', icon: CircleCheck, cls: 'bg-emerald-50 text-emerald-800', note: '₹41,000 left' },
  ];
  return (
    <ul className="space-y-2">
      {cases.map(({ label, icon: Icon, cls, note }) => (
        <li key={label} className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium ${cls}`}>
          <span className="flex items-center gap-2"><Icon size={16} /> {label}</span>
          <span>{note}</span>
        </li>
      ))}
    </ul>
  );
}

function RangeBar() {
  return (
    <div className="pt-2">
      <div className="relative h-3 rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-[22%] right-[18%] rounded-full bg-gradient-to-r from-blue-200 via-[#1d4ed8] to-blue-200" />
        <div className="absolute -top-1 left-[52%] w-1 h-5 rounded bg-[#0b2545]" title="Most likely" />
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-slate-600">
        <span>₹9k</span><span className="font-semibold text-[#0b2545]">likely ₹12k</span><span>₹16k</span>
      </div>
    </div>
  );
}

function MiniFlow() {
  return (
    <svg viewBox="0 0 220 90" className="w-full h-24" role="img" aria-label="Money flowing from income through accounts to categories">
      <path d="M30 45 C80 45 80 20 120 20" stroke="#93c5fd" strokeWidth="10" fill="none" opacity=".8" />
      <path d="M30 45 C80 45 80 70 120 70" stroke="#bfdbfe" strokeWidth="7" fill="none" opacity=".9" />
      <path d="M130 20 C160 20 170 12 200 12" stroke="#1d4ed8" strokeWidth="5" fill="none" opacity=".7" />
      <path d="M130 20 C160 20 170 38 200 38" stroke="#60a5fa" strokeWidth="4" fill="none" opacity=".7" />
      <path d="M130 70 C160 70 170 68 200 68" stroke="#0b2545" strokeWidth="5" fill="none" opacity=".5" />
      {[[22, 45], [125, 20], [125, 70], [204, 12], [204, 38], [204, 68]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 4} y={y - 10} width="8" height="20" rx="3" fill="#0b2545" />
      ))}
    </svg>
  );
}

function Ring() {
  const [ref, visible] = useInView();
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className="relative w-20 h-20">
      <svg viewBox="0 0 80 80" className="-rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" className="ring-fill"
          strokeDasharray={c} strokeDashoffset={visible ? c * 0.28 : c} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-[#0b2545]">72%</span>
    </div>
  );
}

function TamperLog() {
  const rows = ['Jul forecast', 'Aug forecast', 'Sep forecast'];
  return (
    <ul className="space-y-1.5 font-mono text-[12px]">
      {rows.map((row, i) => (
        <li key={row} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-700">
          <span>{row}</span>
          <span className="flex items-center gap-1 text-slate-500"><Link2 size={12} /> {['a3f9', '7c21', 'e08b'][i]}</span>
        </li>
      ))}
      <li className="flex items-center gap-1.5 pt-1 font-sans text-[13px] font-semibold text-emerald-700">
        <CircleCheck size={16} /> Chain intact
      </li>
    </ul>
  );
}

function SafeToSpend() {
  const [ref, visible] = useInView();
  const value = useCountUp(6300, visible);
  return (
    <div ref={ref}>
      <p className="text-[36px] font-extrabold tracking-tight text-[#0b2545] leading-none">{inr(value)}</p>
      <p className="mt-1 text-[13px] text-slate-600">per week until your next salary</p>
    </div>
  );
}

const CARDS = [
  { title: 'An answer for every case', text: 'Yes, only if income is normal, or not yet, worked out for low, normal and high months.', icon: CircleCheck, visual: VerdictCases, span: 'md:col-span-2' },
  { title: 'A range, not a guess', text: 'Your month-end balance as a likely range.', icon: Wallet, visual: RangeBar, span: '' },
  { title: 'See where money went', text: 'Income, accounts, categories and shops in one picture.', icon: Wallet, visual: MiniFlow, span: '' },
  { title: 'Goals with real dates', text: 'Each goal is checked against what you actually save.', icon: CircleCheck, visual: Ring, span: '' },
  { title: 'A record that can’t be edited', text: 'Every forecast is logged and checked against what really happened.', icon: ShieldCheck, visual: TamperLog, span: '' },
  { title: 'Safe to spend this week', text: 'Money left until payday, after bills and a safety buffer.', icon: Wallet, visual: SafeToSpend, span: 'md:col-span-2' },
];

// Leans the card toward the cursor; desktop pointers only and never with reduced motion.
function useTilt(reduced) {
  if (reduced || typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return {};
  return {
    onMouseMove: (e) => {
      const box = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--ry', `${((e.clientX - box.left) / box.width - 0.5) * 6}deg`);
      e.currentTarget.style.setProperty('--rx', `${-((e.clientY - box.top) / box.height - 0.5) * 6}deg`);
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.setProperty('--rx', '0deg');
      e.currentTarget.style.setProperty('--ry', '0deg');
    },
  };
}

export default function FeatureBento() {
  const reduced = useReducedMotion();
  const tilt = useTilt(reduced);
  return (
    <section id="features" data-screen="home" className="py-24 bg-slate-50/70 scroll-mt-16">
      <div className={`max-w-7xl mx-auto px-5 lg:px-10 ${PHONE_SPACE}`}>
        <Reveal className="max-w-xl">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#1d4ed8]">Features</p>
          <h2 className="mt-2 text-[34px] sm:text-[40px] leading-tight font-bold tracking-tight text-[#0b2545]">Clear answers, with the working shown</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map(({ title, text, visual: Visual, span }, i) => (
            <Reveal key={title} delay={(i % 3) * 100} className={span}>
              <article className="tilt h-full rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl flex flex-col gap-4" {...tilt}>
                <div>
                  <h3 className="text-[18px] font-semibold text-[#0b2545]">{title}</h3>
                  <p className="mt-1 text-[14px] text-slate-600">{text}</p>
                </div>
                <div className="mt-auto"><Visual /></div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
