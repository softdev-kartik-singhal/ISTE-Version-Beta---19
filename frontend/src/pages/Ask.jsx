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

export default function Ask() {
  const location = useLocation();
  const [result, setResult] = useState(null);

  // A question typed on the Dashboard arrives through router state.
  const initialQuestion = location.state?.question;
  useEffect(() => {
    askQuestion(initialQuestion).then(setResult);
  }, [initialQuestion]);

  if (!result) return null;

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="flex flex-col w-full">
        <div className="p-space-lg max-w-[1400px] mx-auto w-full space-y-space-xl">
          <QuestionBox
            initialQuestion={result.question}
            presets={result.presets}
            accounts={result.accounts}
            onRecalculate={(q) => askQuestion(q).then(setResult)}
          />
          <VerdictCard verdict={result.verdict} />
          <WaterfallTable waterfall={result.waterfall} />
          <BonusNote bonus={result.bonus} />
          <WhatIfPanel whatIf={result.whatIf} />
          <IncompleteDataNotice checks={result.safeguards} />
        </div>
      </div>
    </main>
  );
}
