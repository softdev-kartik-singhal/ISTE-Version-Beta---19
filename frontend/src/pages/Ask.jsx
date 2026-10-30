// Ask screen: "Can I afford…?" engine with verdict, waterfall, bonus note, what-if levers and data safeguards.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { askQuestion } from '../services/api';
import QuestionBox from '../components/ask/QuestionBox';
import VerdictCard from '../components/ask/VerdictCard';
import WaterfallTable from '../components/ask/WaterfallTable';
import BonusNote from '../components/ask/BonusNote';
import WhatIfPanel from '../components/ask/WhatIfPanel';
import IncompleteDataNotice from '../components/ask/IncompleteDataNotice';
import Toast from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';

export default function Ask() {
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  // A question typed on the Dashboard arrives through router state.
  const initialQuestion = location.state?.question;
  useEffect(() => {
    askQuestion(initialQuestion).then(setResult);
  }, [initialQuestion]);

  function run(question, includeBonus, message) {
    setBusy(true);
    askQuestion(question, { includeBonus }).then((r) => {
      setResult(r);
      setBusy(false);
      showToast(message);
    });
  }

  if (!result) return null;

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="flex flex-col w-full">
        <div className="p-space-lg max-w-[1400px] mx-auto w-full space-y-space-xl">
          <QuestionBox
            initialQuestion={result.question}
            presets={result.presets}
            accounts={result.accounts}
            busy={busy}
            onAsk={(q) => run(q, result.includeBonus, 'Cashflow matrices re-synchronized against latest bank entries')}
          />
          <VerdictCard verdict={result.verdict} />
          <WaterfallTable waterfall={result.waterfall} />
          <BonusNote
            bonus={result.bonus}
            included={result.includeBonus}
            onToggle={() =>
              run(result.question, !result.includeBonus, result.includeBonus ? 'Bonus removed from simulation' : 'Simulation now includes last year’s bonus')
            }
          />
          <WhatIfPanel key={`${result.question}-${result.includeBonus}`} whatIf={result.whatIf} />
          <IncompleteDataNotice checks={result.safeguards} />
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
