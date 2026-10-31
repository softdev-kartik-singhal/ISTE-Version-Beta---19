// Security: dark navy band with an illustrated SmartGullak card and reader, and three true points.
import { FileX2, Hash, KeyRound } from 'lucide-react';
import Reveal from './Reveal';
import { PHONE_SPACE } from './landingHooks';

const POINTS = [
  { icon: KeyRound, text: 'Your password and a tap of your SmartGullak card are both needed to export or delete your data.' },
  { icon: FileX2, text: 'Statement files are deleted after they are read; only the transactions are kept.' },
  { icon: Hash, text: 'Only the last 4 digits of your account numbers are stored.' },
];

// The card hovering over a reader, drawn with SVG.
function CardIllustration() {
  return (
    <svg viewBox="0 0 280 200" className="w-full max-w-[300px]" role="img" aria-label="Illustration of a SmartGullak card held over a card reader">
      <defs>
        <linearGradient id="sg-card" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#1d4ed8" /><stop offset="1" stopColor="#0b2545" />
        </linearGradient>
      </defs>
      <rect x="40" y="140" width="200" height="44" rx="12" fill="#1e293b" stroke="#334155" />
      <circle cx="140" cy="162" r="6" fill="#22c55e" />
      <g transform="rotate(-8 140 80)">
        <rect x="55" y="25" width="170" height="106" rx="14" fill="url(#sg-card)" stroke="rgba(255,255,255,.25)" />
        <rect x="72" y="50" width="30" height="22" rx="4" fill="#fbbf24" opacity=".85" />
        <text x="72" y="112" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter">SmartGullak</text>
        <path d="M190 52 a10 10 0 0 1 0 20 M196 46 a18 18 0 0 1 0 32" stroke="white" strokeWidth="2.5" fill="none" opacity=".8" />
      </g>
    </svg>
  );
}

export default function SecurityBand() {
  return (
    <section id="security" data-screen="card" className="py-24 bg-[#0b2545] text-white scroll-mt-16">
      <div className={`max-w-7xl mx-auto px-5 lg:px-10 ${PHONE_SPACE}`}>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-blue-300">Privacy & security</p>
            <h2 className="mt-2 text-[34px] sm:text-[40px] leading-tight font-bold tracking-tight">Your data stays yours</h2>
            <ul className="mt-8 space-y-5">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-[16px] text-blue-50">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center"><Icon size={18} /></span>
                  <span className="pt-1.5">{text}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={150} className="flex justify-center"><CardIllustration /></Reveal>
        </div>
      </div>
    </section>
  );
}
