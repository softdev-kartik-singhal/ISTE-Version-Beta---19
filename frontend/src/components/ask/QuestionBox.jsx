// Ask question box: free-text question, Ask button and example question pills.
import { useState } from 'react';
import { Brain, CircleCheck, Zap } from 'lucide-react';

const PILL_ACTIVE = 'bg-primary-container text-on-primary shadow-sm flex items-center gap-1.5';
const PILL_IDLE = 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface';

export default function QuestionBox({ initialQuestion, presets, busy, onAsk }) {
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
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
        <form onSubmit={ask} className="relative flex flex-col lg:flex-row items-stretch gap-space-sm">
          <div className="relative flex-1 flex items-center">
            <Brain size={22} className="absolute left-3.5 text-secondary" />
            <input
              className="w-full h-12 pl-12 pr-4 bg-surface rounded-lg font-body-lg text-body-lg text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-inner"
              placeholder={`e.g. ${presets[0]}`}
              aria-label="Your question"
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
              <span>{busy ? 'Working it out…' : 'Ask'}</span>
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
        </div>
      </div>
    </div>
  );
}
