// "Why it's different": typical budget apps vs SmartGullak, four honest rows, words plus icons (never colour alone).
import { Check, Minus } from 'lucide-react';
import Reveal from './Reveal';
import { PHONE_SPACE } from './landingHooks';

const ROWS = [
  { them: 'Look back at what you spent', us: 'Answers forward: can you afford it next month?' },
  { them: 'One number', us: 'A range: if income is low, normal or high' },
  { them: 'Make money from loans and ads', us: 'Never sells your data' },
  { them: 'Hidden maths', us: 'Every step of the answer shown' },
];

export default function Comparison() {
  return (
    <section id="why" data-screen="home" className="py-24 scroll-mt-16">
      <div className={`max-w-7xl mx-auto px-5 lg:px-10 ${PHONE_SPACE}`}>
        <Reveal className="max-w-xl">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#1d4ed8]">Why it’s different</p>
          <h2 className="mt-2 text-[34px] sm:text-[40px] leading-tight font-bold tracking-tight text-[#0b2545]">Built to answer, not to sell</h2>
        </Reveal>
        <Reveal delay={100} className="mt-10 rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[13px] uppercase tracking-wider">
                <th scope="col" className="w-1/2 px-5 py-4 font-semibold text-slate-500 bg-slate-50">Typical budget apps</th>
                <th scope="col" className="w-1/2 px-5 py-4 font-semibold text-white bg-[#0b2545]">SmartGullak</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.us} className="border-t border-slate-100 text-[15px]">
                  <td className="px-5 py-4 text-slate-600">
                    <span className="flex items-start gap-2"><Minus size={18} className="mt-0.5 shrink-0 text-slate-400" aria-label="Typical" /> {row.them}</span>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#0b2545] bg-blue-50/40">
                    <span className="flex items-start gap-2"><Check size={18} className="mt-0.5 shrink-0 text-[#1d4ed8]" aria-label="SmartGullak" /> {row.us}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
