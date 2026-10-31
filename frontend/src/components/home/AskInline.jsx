// "Can I afford…?" inside the hero: glass input, Check button, 3 suggestion chips. On Check a short staged loader
// (about 1.1s: reading statements → upcoming payments → working it out) runs, then the Ask page opens with the question.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Search } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useMotion';

const STAGES = ['Reading your statements', 'Checking upcoming payments', 'Working out your answer'];

export default function AskInline({ example, chips }) {
  const [question, setQuestion] = useState('');
  const [stage, setStage] = useState(-1); // -1 = idle
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function check(e) {
    e.preventDefault();
    const q = question.trim() || example;
    if (reduced) return navigate('/ask', { state: { question: q } });
    setStage(0);
    timers.current = [
      setTimeout(() => setStage(1), 370),
      setTimeout(() => setStage(2), 740),
      setTimeout(() => navigate('/ask', { state: { question: q } }), 1100),
    ];
    return undefined;
  }

  const busy = stage >= 0;
  return (
    <div className="space-y-3">
      <form onSubmit={check} className="flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Can I afford…?</span>
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-100" aria-hidden="true" />
          <input
            className="glass-input w-full h-12 pl-10 pr-4 rounded-xl text-white placeholder:text-blue-100/80 text-[15px] focus:outline-none focus:ring-2 focus:ring-white/70"
            placeholder="Can I afford…?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={busy}
          />
        </label>
        <button type="submit" disabled={busy} className="h-12 px-6 rounded-xl bg-white text-[#0b2545] font-semibold text-[15px] shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-80">
          Check
        </button>
      </form>
      {busy ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-blue-50" aria-live="polite">
          {STAGES.map((s, i) => (
            <li key={s} className={`flex items-center gap-1.5 ${i > stage ? 'opacity-40' : ''}`}>
              {i < stage ? <Check size={14} className="text-emerald-300" /> : i === stage ? <Loader2 size={14} className="animate-spin" /> : <span className="w-3.5" />}
              {s}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button key={c} type="button" onClick={() => setQuestion(c)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[13px] text-blue-50 ring-1 ring-white/20 transition-colors">
              {c.replace(/^Can I (afford|take) an? /, '').replace(/\?$/, '')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
