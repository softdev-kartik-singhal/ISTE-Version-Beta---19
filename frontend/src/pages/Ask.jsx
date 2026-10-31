// Ask screen: "Can I afford...?" in two steps. First we show what we understood (amount and month) for the user to confirm;
// only then is the answer calculated: verdict, waterfall, bonus note, what-if levers and data safeguards.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { askAnswer, getAskSetup, parseQuestion, toAsk } from '../services/api';
import PageTip from '../tour/PageTip';
import PageState from '../components/ui/PageState';
import QuestionBox from '../components/ask/QuestionBox';
import StaleDataBanner from '../components/ui/StaleDataBanner';
import VerdictCard from '../components/ask/VerdictCard';
import WaterfallTable from '../components/ask/WaterfallTable';
import BonusNote from '../components/ask/BonusNote';
import WhatIfPanel from '../components/ask/WhatIfPanel';
import IncompleteDataNotice from '../components/ask/IncompleteDataNotice';
import Toast from '../components/ui/Toast';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';

const FIELD = 'h-10 px-3 rounded-lg bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container';

export default function Ask() {
  const location = useLocation();
  const setup = useApi(getAskSetup);
  const [question, setQuestion] = useState(location.state?.question || '');
  const [understood, setUnderstood] = useState(null); // what the parser found, waiting for the user's OK
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
      setUnderstood(parsed);
      setFields({ amount: parsed.amountPaise ? String(parsed.amountPaise / 100) : '', month: parsed.targetMonth || '' });
    } catch (err) {
      showToast(err.message);
    }
    setBusy(false);
  }

  useEffect(() => {
    if (setup.ready && location.state?.question) understand(location.state.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup.ready]);

  // Step 2: calculate, with the amount and month as confirmed (or corrected) by the user.
  async function confirm() {
    setBusy(true);
    try {
      setResult(await askAnswer(Number(fields.amount), fields.month));
      setUnderstood(null);
    } catch (err) {
      showToast(err.message);
    }
    setBusy(false);
  }

  if (!setup.ready) return <PageState state={setup} />;
  const view = result?.raw ? toAsk(result.raw, result.recurring, includeBonus) : null;

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <PageTip id="ask" text="Try: Can I afford ₹20,000 next month?" />
      <div className="flex flex-col w-full">
        <div className="p-space-lg max-w-[1400px] mx-auto w-full space-y-space-xl">
          <StaleDataBanner asOf={setup.data.asOf} />
          <QuestionBox initialQuestion={question} presets={setup.data.presets} accounts={setup.data.accounts} busy={busy} onAsk={understand} />

          {understood && (
            <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg space-y-space-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Here is what I understood. Please check it.</h3>
              {understood.amountCandidates.length > 1 && (
                <p className="font-body-sm text-body-sm text-secondary">I found more than one amount ({understood.amountCandidates.map((c) => c.text).join(', ')}). Enter the one you mean.</p>
              )}
              <div className="flex flex-wrap items-end gap-space-md">
                <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface">
                  Amount (₹)
                  <input className={FIELD} type="number" min="1" value={fields.amount} onChange={(e) => setFields({ ...fields, amount: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface">
                  Month
                  <input className={FIELD} type="month" value={fields.month} onChange={(e) => setFields({ ...fields, month: e.target.value })} />
                </label>
                <button className="h-10 px-space-lg rounded-lg bg-primary-container text-on-primary font-label-md text-label-md disabled:opacity-60" disabled={busy || !Number(fields.amount) || !fields.month} onClick={confirm} data-tour="ask-confirm">
                  Confirm and calculate
                </button>
              </div>
            </div>
          )}

          {result?.insufficient && <IncompleteDataNotice checks={result.safeguards} />}
          {view && (
            <>
              <VerdictCard verdict={view.verdict} />
              <WaterfallTable waterfall={view.waterfall} />
              {view.bonus && <BonusNote bonus={view.bonus} included={includeBonus} onToggle={() => setIncludeBonus(!includeBonus)} />}
              <WhatIfPanel key={`${result.raw.pricePaise}-${includeBonus}`} whatIf={view.whatIf} />
              <IncompleteDataNotice checks={view.safeguards} />
            </>
          )}
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
