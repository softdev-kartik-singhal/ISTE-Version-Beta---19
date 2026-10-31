// Ask: one clear answer first, every step one tap away.
// Flow: type a question → we show what we understood (amount · month · Edit) → a short staged loader → the answer card.
// Below it: "Show how we worked it out" (closed), the bonus note (only if there is a one-off income), "Try a change",
// and the last 3 questions.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { askAnswer, getAskSetup, parseQuestion } from '../services/api';
import { monthNote, toAskView, toSubscriptions } from '../services/askView';
import PageTip from '../tour/PageTip';
import PageState from '../components/ui/PageState';
import Toast from '../components/ui/Toast';
import AskHero from '../components/ask/AskHero';
import ConfirmChip from '../components/ask/ConfirmChip';
import StageLoader from '../components/ask/StageLoader';
import AnswerCard from '../components/ask/AnswerCard';
import BonusCard from '../components/ask/BonusCard';
import ShowHow from '../components/ask/ShowHow';
import TryAChange from '../components/ask/TryAChange';
import RecentQuestions from '../components/ask/RecentQuestions';
import CantAnswer from '../components/ask/CantAnswer';
import '../components/ask/ask.css';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { useReducedMotion } from '../hooks/useMotion';
import { useRecentQuestions } from '../hooks/useRecentQuestions';

const LOADER_MS = 1100;

export default function Ask() {
  const location = useLocation();
  const { account } = useOutletContext();
  const reduced = useReducedMotion();
  const setup = useApi(getAskSetup);
  const [question, setQuestion] = useState(location.state?.question || '');
  const [understood, setUnderstood] = useState(null); // what the parser found; shown as the confirm chip
  const [asked, setAsked] = useState(0); // counts questions, so the chip starts fresh for each one
  const [fields, setFields] = useState({ amount: '', month: '' });
  const [result, setResult] = useState(null); // { raw, recurring, amount, month, text } or { insufficient, safeguards }
  const [includeBonus, setIncludeBonus] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [recent, remember] = useRecentQuestions();
  const [toast, showToast] = useToast();

  // Step 1: understand the sentence. A question typed on Home arrives through router state.
  async function understand(text) {
    setParsing(true);
    setQuestion(text);
    setResult(null);
    setIncludeBonus(false);
    try {
      const parsed = await parseQuestion(text);
      setUnderstood(parsed);
      setFields({ amount: parsed.amountPaise ? String(parsed.amountPaise / 100) : '', month: parsed.targetMonth || '' });
      setAsked((n) => n + 1);
    } catch (err) {
      showToast(err.message);
    }
    setParsing(false);
  }

  // An answer belongs to the account it was worked out for: choosing another account clears it.
  const firstAccount = useRef(true);
  useEffect(() => {
    if (firstAccount.current) {
      firstAccount.current = false;
      return;
    }
    setResult(null);
    setUnderstood(null);
  }, [account]);

  useEffect(() => {
    if (setup.ready && location.state?.question) understand(location.state.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup.ready]);

  // Step 2: calculate with the amount and month from the chip. The staged loader shows for about 1.1 seconds.
  async function calculate(values, text = question) {
    setCalculating(true);
    setResult(null);
    setIncludeBonus(false);
    setFields(values);
    try {
      const wait = new Promise((done) => setTimeout(done, reduced ? 0 : LOADER_MS));
      const [res] = await Promise.all([askAnswer(Number(values.amount), values.month), wait]);
      const amount = Number(values.amount);
      setResult({ ...res, amount, month: values.month, text });
      if (res.raw) remember({ text, amount, month: values.month, state: toAskView(res.raw, false).state });
    } catch (err) {
      showToast(err.message);
    }
    setCalculating(false);
  }

  // A recent question opens its answer again straight away.
  function reopen(q) {
    setQuestion(q.text);
    setUnderstood({ amountCandidates: [] });
    setAsked((n) => n + 1);
    calculate({ amount: String(q.amount), month: q.month }, q.text);
  }

  if (!setup.ready) return <PageState state={setup} />;
  const view = result?.raw ? toAskView(result.raw, includeBonus) : null;
  const key = result ? `${result.text}|${result.amount}|${result.month}` : '';

  return (
    <main className="relative pt-16 min-h-screen bg-[#f5f7fb] font-['Inter',system-ui,sans-serif]">
      <PageTip id="ask" text="Try: Can I afford ₹20,000 next month?" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-6 lg:pt-16 lg:pb-10 space-y-6">
        <AskHero presets={setup.data.presets.slice(1)} accountsLabel={setup.data.accountsLabel} asOf={setup.data.asOf} question={question} setQuestion={setQuestion} busy={parsing || calculating} onAsk={understand}>
          {understood && (
            <ConfirmChip
              key={asked}
              fields={fields}
              candidates={understood.amountCandidates}
              monthText={fields.month ? monthNote(fields.month, setup.data.asOf) : ''}
              answered={Boolean(result?.raw)}
              busy={calculating}
              onConfirm={(values) => calculate(values)}
            />
          )}
        </AskHero>

        {calculating && <StageLoader />}
        {result?.insufficient && <CantAnswer reason={result.safeguards[0]?.detail || ''} />}

        {view && (
          <>
            <AnswerCard key={`answer-${key}`} view={view} celebrateKey={key} ghost={includeBonus ? view.baseLeft : null} ghostLabel="Without the bonus" />
            {view.bonus && <BonusCard bonus={view.bonus} included={includeBonus} onToggle={() => setIncludeBonus(!includeBonus)} />}
            <ShowHow cases={view.cases} />
            <TryAChange key={`change-${key}`} amount={result.amount} month={result.month} monthsAhead={result.raw.months.length} subs={toSubscriptions(result.recurring)} bonusOn={includeBonus} />
          </>
        )}

        <RecentQuestions items={recent} onOpen={reopen} />
      </div>
      <Toast message={toast} />
    </main>
  );
}
