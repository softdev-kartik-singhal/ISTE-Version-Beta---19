// Top of Ask: "What do you want to buy?", a big input with a Check button, suggestion chips, which accounts are used,
// and a small note when the statements are old. The confirm chip and loader are passed in as children.
import { Link } from 'react-router-dom';
import { CalendarClock, Laptop, Plane, Smartphone, Sparkles } from 'lucide-react';
import { addMonths } from '../../services/askView';
import { monthName } from '../../services/adapters';

const STALE_AFTER_DAYS = 7;
const CHIP_ICONS = [[/laptop|computer/i, Laptop], [/phone/i, Smartphone], [/trip|travel|flight|holiday/i, Plane]];

// "Can I afford a ₹80,000 laptop next month?" → "₹80,000 laptop next month"
const chipLabel = (q) => q.replace(/^Can I (afford|take) an? /i, '').replace(/\?$/, '');
const chipIcon = (q) => (CHIP_ICONS.find(([re]) => re.test(q)) || [null, Sparkles])[1];

export default function AskHero({ presets, accountsLabel, asOf, question, setQuestion, busy, onAsk, children }) {
  const stale = (Date.now() - new Date(`${asOf}T00:00:00`)) / 864e5 > STALE_AFTER_DAYS;
  const end = new Date(`${asOf}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  function submit(e) {
    e.preventDefault();
    if (question.trim()) onAsk(question.trim());
  }

  return (
    <section className="space-y-4">
      <h1 className="text-[30px] sm:text-[38px] font-extrabold tracking-tight text-[#0b2545]">What do you want to buy?</h1>
      <form onSubmit={submit} data-tour="ask-box" className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Your question</span>
          <Sparkles size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1d4ed8]" aria-hidden="true" />
          <input
            data-tour="ask-input"
            className="w-full h-14 pl-14 pr-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-[16px] text-[#0b2545] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
            placeholder="e.g. Can I afford an ₹80,000 laptop next month?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy} data-tour="ask-submit" className="h-14 px-8 rounded-2xl bg-[#1d4ed8] text-white text-[16px] font-semibold shadow-lg shadow-blue-600/25 hover:bg-[#1e40af] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70">
          {busy ? 'Reading…' : 'Check'}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const Icon = chipIcon(p);
          return (
            <button key={p} type="button" onClick={() => { setQuestion(p); onAsk(p); }} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[13px] text-slate-700 hover:border-[#1d4ed8] hover:text-[#1d4ed8] transition-colors">
              <Icon size={14} aria-hidden="true" /> {chipLabel(p)}
            </button>
          );
        })}
      </div>
      {children}
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
        <span>Checked against your {accountsLabel}.</span>
        {stale && (
          <span className="inline-flex items-center gap-1 text-amber-800">
            <CalendarClock size={13} aria-hidden="true" /> Your latest statement ends {end}.{' '}
            <Link to="/statements" className="font-semibold underline underline-offset-2 hover:no-underline">Upload {monthName(addMonths(asOf.slice(0, 7), 1))}</Link>
          </span>
        )}
      </p>
    </section>
  );
}
