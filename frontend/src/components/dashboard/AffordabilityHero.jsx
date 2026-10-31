// "Affordability Engine" box at the top of the Dashboard: question input plus quick-test chips.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck, Sparkles } from 'lucide-react';

export default function AffordabilityHero({ defaultQuestion, quickQuestions }) {
  const [question, setQuestion] = useState(defaultQuestion);
  const navigate = useNavigate();

  function simulate(event) {
    event.preventDefault();
    navigate('/ask', { state: { question } });
  }

  return (
    <section className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E3E8EF]">
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Affordability Engine</h2>
              <p className="font-body-sm text-body-sm text-secondary">
                Deterministic cashflow runway engine calibrated to your salary cadence &amp; pending receivables
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-secondary text-label-sm font-label-sm">
            <ShieldCheck size={14} className="text-primary" />
            <span>Deterministic Model</span>
          </div>
        </div>
        <form onSubmit={simulate} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-space-sm pt-space-xs">
          <div className="relative flex-1 flex items-center">
            <Search size={20} className="absolute left-3.5 text-secondary" />
            <input
              className="w-full h-11 pl-11 pr-4 rounded-lg bg-surface font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container border border-[#E3E8EF]"
              placeholder={defaultQuestion}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <button
            className="h-11 px-space-lg rounded-lg bg-primary-container text-white font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            type="submit"
          >
            <span>Simulate Affordability</span>
            <ArrowRight size={18} />
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2 pt-space-xs">
          <span className="font-label-sm text-label-sm text-secondary">Quick tests:</span>
          {quickQuestions.map((q) => (
            <button
              key={q}
              className="px-2.5 py-1 rounded-md bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors font-body-sm text-body-sm"
              type="button"
              onClick={() => setQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
