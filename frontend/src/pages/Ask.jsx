// Ask ("Can I afford it?"): a chip shows what we understood (amount · month · Edit), then the short answer
// (verdict, one sentence, one suggestion). "Show how" opens every calculation step, the bonus note and "Try a change".
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { askAnswer, getAskSetup, parseQuestion, toAsk } from '../services/api';
import PageState from '../components/ui/PageState';
import QuestionBox from '../components/ask/QuestionBox';
import VerdictCard from '../components/ask/VerdictCard';
import WaterfallTable from '../components/ask/WaterfallTable';
import BonusNote from '../components/ask/BonusNote';
import WhatIfPanel from '../components/ask/WhatIfPanel';
import IncompleteDataNotice from '../components/ask/IncompleteDataNotice';
import AnswerSummary from '../components/ask/AnswerSummary';
import CantAnswer from '../components/ask/CantAnswer';
import PageHeader from '../components/ui/PageHeader';
import ShowHow from '../components/ui/ShowHow';
import ConfirmChip from '../components/ask/ConfirmChip';
import Toast from '../components/ui/Toast';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';

export default function Ask() {
  const location = useLocation();
  const setup = useApi(getAskSetup);
  const [question, setQuestion] = useState(location.state?.question || '');
  const [understood, setUnderstood] = useState(null); // what the parser found; shown as the confirm chip
  const [fields, setFields] = useState({ amount: '', month: '' });
  const [result, setResult] = useState(null); // { raw, recurring } or { insufficient, safeguards }
  const [includeBonus, setIncludeBonus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  // Step 1: understand the sentence. A question typed on the Dashboard arrives through router state.
  async function understand(text) {
    setBusy(true);
    setQuestion(text);
    setResult(null);
    try {
      const parsed = await parseQuestion(text);
      const found = { amount: parsed.amountPaise ? String(parsed.amountPaise / 100) : '', month: parsed.targetMonth || '' };
      setUnderstood(parsed);
      setFields(found);
      // Only one clear amount and a month: answer straight away; the chip above lets the user correct it.
      if (found.amount && found.month && parsed.amountCandidates.length <= 1) return calculate(found);
    } catch (err) {
      showToast(err.message);
    }
    setBusy(false);
  }

  useEffect(() => {
    if (setup.ready && location.state?.question) understand(location.state.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup.ready]);

  // Step 2: calculate with the amount and month from the chip (as parsed, or as corrected by the user).
  async function calculate(values) {
    setBusy(true);
    setFields(values);
    try {
      setResult(await askAnswer(Number(values.amount), values.month));
    } catch (err) {
      showToast(err.message);
    }
    setBusy(false);
  }

  if (!setup.ready) return <PageState state={setup} />;
  const view = result?.raw ? toAsk(result.raw, result.recurring, includeBonus) : null;

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="flex flex-col w-full">
        <div className="p-space-md lg:p-space-xl max-w-5xl mx-auto w-full space-y-space-lg">
          <PageHeader title="Can I afford it?" />
          <QuestionBox initialQuestion={question} presets={setup.data.presets} busy={busy} onAsk={understand} />

          {understood && (
            <ConfirmChip
              key={`${question}-${fields.amount}-${fields.month}`}
              fields={fields}
              candidates={understood.amountCandidates}
              busy={busy}
              onSubmit={calculate}
            />
          )}

          {result?.insufficient && <CantAnswer reason={result.safeguards[0]?.detail || ''} />}
          {view && (
            <>
              <AnswerSummary verdict={view.verdict} />
              <ShowHow>
                <WaterfallTable waterfall={view.waterfall} />
                <VerdictCard verdict={view.verdict} />
                {view.bonus && <BonusNote bonus={view.bonus} included={includeBonus} onToggle={() => setIncludeBonus(!includeBonus)} />}
                <WhatIfPanel key={`${result.raw.pricePaise}-${includeBonus}`} whatIf={view.whatIf} />
                <IncompleteDataNotice checks={view.safeguards} />
              </ShowHow>
            </>
          )}
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
