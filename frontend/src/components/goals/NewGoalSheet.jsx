// The new-goal / edit-goal sheet. Three steps: what is it for (an icon tile) -> name and amount -> by when.
// From step 2 on, a live preview (asked of the server, which uses the same rules as the page) shows the monthly amount
// and the status as the user types. Saving shows a short staged loader. Full screen on phones.
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, X } from 'lucide-react';
import { previewGoal } from '../../services/api';
import { STATUS, TILES, datePlusMonths, fullDate, groupDigits, onlyDigits, tileByKey, tileFor, todayIso, tomorrowIso } from './goalKit';
import { exact, rounded } from '../../utils/money';

const PICKS = [
  { key: '3m', label: '3 months', months: 3 }, { key: '6m', label: '6 months', months: 6 },
  { key: '1y', label: '1 year', months: 12 }, { key: '2y', label: '2 years', months: 24 },
];
const STAGES = ['Checking your numbers', 'Planning the months', 'Saving your goal'];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const FIELD = 'h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[16px] text-[#0b2545] focus:outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20';

function Preview({ values, excludeId }) {
  const [result, setResult] = useState(null);
  const ready = values.target > 0 && values.date > todayIso();
  useEffect(() => {
    if (!ready) {
      setResult(null);
      return undefined;
    }
    let live = true;
    const timer = setTimeout(() => {
      previewGoal(values, excludeId).then((r) => live && setResult(r)).catch(() => live && setResult(null));
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [values.name, values.target, values.saved, values.date, values.category, excludeId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready) return <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-[14px] text-slate-500">Choose an amount and a date to see what it takes each month.</p>;
  if (!result) return <div className="h-[92px] animate-pulse rounded-2xl bg-slate-100" aria-label="Working it out" />;
  const status = STATUS[result.statusCode] || STATUS.none;
  const Icon = status.icon;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0b2545] to-[#1d4ed8] p-5 text-white" aria-live="polite">
      <p className="text-[13px] text-blue-100">You would put away</p>
      <p className="tabular-nums text-[30px] font-extrabold leading-tight" title={`Exact: ${exact(result.monthly)}`}>{rounded(result.monthly)} <span className="text-[16px] font-medium text-blue-100">a month</span></p>
      <p className="mt-0.5 text-[13px] text-blue-100">for {result.months} {result.months === 1 ? 'month' : 'months'}, until {fullDate(values.date)}</p>
      <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[14px] font-semibold text-[#0b2545]">
        <Icon size={16} className={status.text} aria-hidden="true" /> {result.statusLine}
      </span>
    </div>
  );
}

export default function NewGoalSheet({ goal, preset, onClose, onSave }) {
  const editing = Boolean(goal);
  const startTile = goal ? tileFor(goal.rawName, goal.category) : preset || null;
  const [step, setStep] = useState(editing || preset ? 2 : 1);
  const [tileKey, setTileKey] = useState(startTile?.key || null);
  const [name, setName] = useState(goal?.rawName ?? preset?.name ?? '');
  const [amount, setAmount] = useState(goal ? String(Math.round(goal.target)) : '');
  const [saved, setSaved] = useState(goal && goal.saved ? String(Math.round(goal.saved)) : '');
  const [date, setDate] = useState(goal?.targetDate ?? '');
  const [pick, setPick] = useState(goal ? 'custom' : '');
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState('');

  const tile = tileKey ? tileByKey(tileKey) : null;
  const target = Number(amount) || 0;
  const values = useMemo(() => ({
    name: name.trim() || tile?.name || 'New goal', target, saved: Math.min(Number(saved) || 0, target), date, category: goal?.category && editing && tile?.key === startTile?.key ? goal.category : tile?.category || 'Other',
  }), [name, target, saved, date, tile, goal, editing, startTile]);
  const nameOk = name.trim().length > 0;
  const dateOk = date > todayIso();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && stage < 0 && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, stage]);

  function choose(t) {
    setTileKey(t.key);
    if (!name.trim() || TILES.some((x) => x.name === name.trim())) setName(t.name);
    setStep(2);
  }

  async function save() {
    setError('');
    setStage(0);
    const timers = [setTimeout(() => setStage(1), 380), setTimeout(() => setStage(2), 760)];
    try {
      await Promise.all([onSave({ ...values, name: values.name, id: goal?.id, priority: goal?.priority }), wait(1100)]);
    } catch (err) {
      setError(err.message);
      setStage(-1);
    }
    timers.forEach(clearTimeout);
  }

  const busy = stage >= 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b2545]/50 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={editing ? 'Edit goal' : 'New goal'} className="sheet-in relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[19px] font-bold text-[#0b2545]">{editing ? 'Edit goal' : 'New goal'}</h2>
            <p className="text-[13px] text-slate-500">Step {step} of 3</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex gap-1.5" aria-hidden="true">{[1, 2, 3].map((n) => <span key={n} className={`h-2 w-7 rounded-full ${n <= step ? 'bg-[#1d4ed8]' : 'bg-slate-200'}`} />)}</span>
            <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={20} aria-hidden="true" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {step === 1 && (
            <>
              <h3 className="text-[18px] font-semibold text-[#0b2545]">What are you saving for?</h3>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {TILES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.key} type="button" onClick={() => choose(t)} aria-pressed={tileKey === t.key}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition-colors hover:bg-slate-50 ${tileKey === t.key ? 'border-[#1d4ed8] bg-blue-50/50' : 'border-slate-200'}`}>
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${t.tint}`}><Icon size={21} aria-hidden="true" /></span>
                      <span className="text-[13px] font-medium leading-tight text-slate-800">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-[18px] font-semibold text-[#0b2545]">Name it and set the amount</h3>
              <div>
                <label htmlFor="goal-name" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Goal name</label>
                <input id="goal-name" className={FIELD} value={name} maxLength={80} autoFocus onChange={(e) => setName(e.target.value)} placeholder="For example, New Laptop" />
              </div>
              <div>
                <label htmlFor="goal-amount" className="mb-1.5 block text-[13px] font-semibold text-slate-700">How much do you need?</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">₹</span>
                  <input id="goal-amount" className={`${FIELD} pl-8 text-[18px] font-semibold tabular-nums`} inputMode="numeric" autoComplete="off" value={groupDigits(amount)} onChange={(e) => setAmount(onlyDigits(e.target.value))} placeholder="0" />
                </div>
              </div>
              <div>
                <label htmlFor="goal-saved" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Already saved <span className="font-normal text-slate-500">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">₹</span>
                  <input id="goal-saved" className={`${FIELD} pl-8 tabular-nums`} inputMode="numeric" autoComplete="off" value={groupDigits(saved)} onChange={(e) => setSaved(onlyDigits(e.target.value))} placeholder="0" />
                </div>
              </div>
              {editing && <Preview values={values} excludeId={goal.id} />}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-[18px] font-semibold text-[#0b2545]">By when?</h3>
              <div className="flex flex-wrap gap-2.5" role="group" aria-label="Quick picks">
                {PICKS.map((p) => (
                  <button key={p.key} type="button" aria-pressed={pick === p.key} onClick={() => { setPick(p.key); setDate(datePlusMonths(p.months)); }}
                    className={`h-11 rounded-full border px-5 text-[15px] font-semibold ${pick === p.key ? 'border-[#1d4ed8] bg-[#1d4ed8] text-white' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}>{p.label}</button>
                ))}
                <button type="button" aria-pressed={pick === 'custom'} onClick={() => setPick('custom')}
                  className={`h-11 rounded-full border px-5 text-[15px] font-semibold ${pick === 'custom' ? 'border-[#1d4ed8] bg-[#1d4ed8] text-white' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}>Pick a date</button>
              </div>
              {pick === 'custom' && (
                <div>
                  <label htmlFor="goal-date" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Target date</label>
                  <input id="goal-date" type="date" className={FIELD} min={tomorrowIso()} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              )}
              <Preview values={values} excludeId={editing ? goal.id : undefined} />
            </div>
          )}
          {error && <p role="alert" className="mt-4 text-[14px] text-red-700">{error}</p>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
          {step > 1 && !(step === 2 && preset && !editing) ? (
            <button type="button" onClick={() => setStep(step - 1)} disabled={busy} className="flex h-11 items-center gap-1.5 rounded-xl px-4 text-[15px] font-semibold text-slate-700 hover:bg-slate-100"><ArrowLeft size={17} aria-hidden="true" /> Back</button>
          ) : <span />}
          {step === 1 && <span className="text-[13px] text-slate-500">Pick one to continue</span>}
          {step === 2 && <button type="button" disabled={!nameOk || target <= 0} onClick={() => setStep(3)} className="flex h-11 items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-6 text-[15px] font-semibold text-white hover:bg-[#1e40af] disabled:opacity-40">Next <ArrowRight size={17} aria-hidden="true" /></button>}
          {step === 3 && <button type="button" disabled={!dateOk || busy} onClick={save} className="flex h-11 items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-6 text-[15px] font-semibold text-white hover:bg-[#1e40af] disabled:opacity-40"><Check size={17} aria-hidden="true" /> {editing ? 'Save changes' : 'Create goal'}</button>}
        </footer>

        {busy && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-white/95" role="status" aria-live="polite">
            <LoaderCircle size={34} className="animate-spin text-[#1d4ed8]" aria-hidden="true" />
            <ol className="space-y-2 text-[15px]">
              {STAGES.map((label, i) => (
                <li key={label} className={`flex items-center gap-2.5 ${i < stage ? 'text-emerald-700' : i === stage ? 'font-semibold text-[#0b2545]' : 'text-slate-400'}`}>
                  {i < stage ? <Check size={16} aria-hidden="true" /> : <span className="h-4 w-4" />} {label}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
