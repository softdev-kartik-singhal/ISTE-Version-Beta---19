// Ask page header and question box: free-text question, Recalculate button and preset question pills.
import { useState } from 'react';
import { Brain, CircleCheck, Network, Zap } from 'lucide-react';

const PILL_ACTIVE = 'bg-primary-container text-on-primary shadow-sm flex items-center gap-1.5';
const PILL_IDLE = 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface';

export default function QuestionBox({ initialQuestion, presets, accounts, busy, onAsk }) {
  const [question, setQuestion] = useState(initialQuestion);

  function ask(e) {
    e.preventDefault();
    onAsk(question);
  }

  function pickPreset(preset) {
    setQuestion(preset);
    onAsk(preset);
  }

  return (
    <div className="space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Ask SmartGullak — Cashflow Affordability Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold tracking-wide">
              Decision Intelligence v2.4
            </span>
          </div>
          <p className="font-body-md text-body-md text-secondary max-w-4xl">
            Simulate major purchases against normalized multi-bank cashflow, committed obligations, and variable income volatility.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto bg-surface-container-low px-3 py-1.5 rounded-lg shadow-sm">
          <span className="w-2 h-2 rounded-full bg-surface-tint" />
          <span className="font-label-sm text-label-sm text-secondary">Calibrated on 180-day baseline</span>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
        <form onSubmit={ask} className="relative flex flex-col lg:flex-row items-stretch gap-space-sm">
          <div className="relative flex-1 flex items-center">
            <Brain size={22} className="absolute left-3.5 text-secondary" />
            <input
              className="w-full h-12 pl-12 pr-4 bg-surface rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-inner"
              placeholder={`e.g. ${presets[0]}`}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              type="submit"
              disabled={busy}
              className={`h-12 px-space-lg rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-body-md font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] ${busy ? 'opacity-75' : ''}`}
            >
              <Zap size={20} />
              <span>{busy ? 'Calculating...' : 'Recalculate'}</span>
            </button>
          </div>
        </form>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm pt-space-xs">
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((preset) => {
              const active = preset === question;
              return (
                <button
                  key={preset}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${active ? PILL_ACTIVE : PILL_IDLE}`}
                  onClick={() => pickPreset(preset)}
                >
                  {active && <CircleCheck size={14} />}
                  <span>{preset}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm shrink-0">
            <Network size={16} className="text-surface-tint" />
            <span>
              Analyzed across {accounts.length} connected accounts: <strong>{accounts.join(', ')}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
