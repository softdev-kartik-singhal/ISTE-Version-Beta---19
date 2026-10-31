// "Suggestions for you": an optional About-you form, then AI-assisted product-type suggestions.
// The server builds an anonymous profile (bands and labels only) and checks the AI's answer; this card only displays it.
import { useEffect, useState } from 'react';
import { CalendarClock, ChevronDown, CircleCheck, ClipboardCheck, Gauge, LoaderCircle, Lock, RefreshCw, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { getSuggestions, getSuggestionsAbout, saveSuggestionsAbout } from '../../services/api';

const FIELDS = [
  { name: 'age_band', label: 'Age', options: ['18–25', '26–35', '36–50', '50+'] },
  { name: 'dependents', label: 'Dependents', options: ['none', '1–2', '3+'] },
  { name: 'risk_comfort', label: 'Comfort with risk', options: ['low', 'medium', 'high'] },
  { name: 'employer_health_cover', label: 'Health cover from employer', options: ['yes', 'no'], bool: true },
  { name: 'has_daughter', label: 'A daughter under 10', options: ['yes', 'no'], bool: true },
];
const RISK = {
  low: { icon: ShieldCheck, cls: 'bg-emerald-50 text-emerald-800', text: 'Low risk' },
  medium: { icon: Gauge, cls: 'bg-amber-50 text-amber-800', text: 'Medium risk' },
  high: { icon: TriangleAlert, cls: 'bg-error-container/60 text-error', text: 'Higher risk' },
};
const STAGES = ['Building your private profile', 'Asking the AI', 'Checking suggestions'];
const SELECT = 'w-full h-11 pl-3.5 pr-9 rounded-xl bg-white border border-slate-200 text-[15px] text-slate-900 appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20';

// 'fixed deposit (under 1 year)' -> title 'Fixed deposit' + detail 'under 1 year'. The model returns lowercase names.
const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);
function splitName(name) {
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { title: sentence(m[1]), detail: m[2] } : { title: sentence(name), detail: '' };
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The saved answer (true/false/string) <-> the select's text value.
const toText = (field, v) => (v === undefined || v === null ? '' : field.bool ? (v ? 'yes' : 'no') : v);
const fromText = (field, text) => (text === '' ? null : field.bool ? text === 'yes' : text);

export default function SuggestionsCard() {
  const [about, setAbout] = useState({});
  const [stage, setStage] = useState(-1); // -1 = not loading, otherwise the index in STAGES
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showShared, setShowShared] = useState(false);

  useEffect(() => {
    getSuggestionsAbout().then(setAbout).catch(() => {});
  }, []);

  // Three real stages: the profile is built and the request goes out together, so the stages show the real work.
  async function run(refresh) {
    setError('');
    setStage(0);
    try {
      await saveSuggestionsAbout(about); // the profile is built from what is saved
      await wait(400);
      setStage(1);
      const [data] = await Promise.all([getSuggestions(refresh), wait(500)]);
      setStage(2);
      await wait(300);
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setStage(-1);
  }

  const busy = stage >= 0;
  return (
    <section className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg space-y-space-md">
      <div className="flex items-start gap-space-sm">
        <div className="w-9 h-9 rounded-lg bg-secondary-fixed/60 text-primary flex items-center justify-center shrink-0"><Sparkles size={20} /></div>
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Suggestions for you</h2>
          <p className="text-[14px] text-slate-600 mt-0.5">Product types that fit your situation, picked from a private profile of labels and bands.</p>
        </div>
      </div>

      <div className="rounded-xl bg-surface-container-low/60 p-5 sm:p-6 space-y-5">
        <p className="text-[16px] font-semibold text-on-surface">About you <span className="font-normal text-secondary">(optional)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FIELDS.map((f) => (
            <label key={f.name} className="flex flex-col gap-1.5 text-[13px] font-medium text-slate-600">
              {f.label}
              <span className="relative">
                <select className={SELECT} value={toText(f, about[f.name])} onChange={(e) => setAbout({ ...about, [f.name]: fromText(f, e.target.value) })}>
                  <option value="">Prefer not to say</option>
                  {f.options.map((o) => <option key={o} value={o}>{sentence(o)}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </span>
            </label>
          ))}
        </div>
        <button className="h-11 px-6 rounded-xl bg-primary-container text-white hover:bg-primary text-[15px] font-semibold flex items-center gap-2 shadow-sm disabled:opacity-60" disabled={busy} onClick={() => run(false)}>
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
          <span>{busy ? STAGES[stage] : result ? 'Update suggestions' : 'Get suggestions'}</span>
        </button>
        {busy && (
          <ol className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
            {STAGES.map((s, i) => (
              <li key={s} className={i <= stage ? 'text-primary font-semibold' : 'text-outline'}>{i + 1}. {s}</li>
            ))}
          </ol>
        )}
        {error && <p className="text-[14px] text-error">{error}</p>}
      </div>

      {result?.insufficientHistory && (
        <p className="text-[14px] text-slate-600">Upload at least one complete month of statements to get suggestions.</p>
      )}

      {result && !result.insufficientHistory && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <p className="text-[14px] text-slate-600">
              {result.source === 'rules' ? result.note : result.cached ? 'AI suggestions (saved from an earlier request)' : 'AI suggestions, checked by our rules'}
            </p>
            <button className="text-[14px] font-semibold text-primary hover:underline flex items-center gap-1.5 disabled:opacity-60" disabled={busy} onClick={() => run(true)}>
              <RefreshCw size={15} /> Refresh suggestions
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {result.suggestions.map((s) => {
              const risk = RISK[s.risk_level] || RISK.low;
              const { title, detail } = splitName(s.product_type);
              return (
                <article key={s.product_type} className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 flex flex-col gap-5">
                  <header className="flex items-start gap-4">
                    <span className="w-9 h-9 shrink-0 rounded-full bg-primary-container text-white text-[15px] font-bold flex items-center justify-center" aria-label={`Priority ${s.priority}`}>{s.priority}</span>
                    <div className="min-w-0">
                      <h3 className="text-[19px] leading-snug font-semibold text-on-surface">{title}</h3>
                      {detail && <p className="text-[14px] text-slate-500 mt-0.5">{sentence(detail)}</p>}
                    </div>
                  </header>

                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${risk.cls}`}><risk.icon size={14} aria-hidden="true" /> {risk.text}</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-slate-100 text-slate-700"><CalendarClock size={14} aria-hidden="true" /> Suits goals {s.suits_goal_horizon}</span>
                  </div>

                  <div className="space-y-4">
                    <section>
                      <h4 className="flex items-center gap-2 text-[14px] font-semibold text-on-surface"><CircleCheck size={16} className="text-emerald-600" aria-hidden="true" /> Why this fits you</h4>
                      <p className="mt-1 pl-6 text-[15px] leading-relaxed text-slate-700">{s.why_it_fits}</p>
                    </section>
                    <section>
                      <h4 className="flex items-center gap-2 text-[14px] font-semibold text-on-surface"><ClipboardCheck size={16} className="text-primary" aria-hidden="true" /> Check before choosing</h4>
                      <p className="mt-1 pl-6 text-[15px] leading-relaxed text-slate-700">{s.what_to_check}</p>
                    </section>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-lg bg-surface-container-low/60">
            <button className="w-full flex items-center justify-between px-space-md py-space-sm font-label-md text-label-md text-on-surface" onClick={() => setShowShared(!showShared)} aria-expanded={showShared}>
              <span className="flex items-center gap-2"><Lock size={16} className="text-primary" /> What we shared with the AI</span>
              <ChevronDown size={18} className={`transition-transform ${showShared ? 'rotate-180' : ''}`} />
            </button>
            {showShared && (
              <div className="px-space-md pb-space-md space-y-space-xs">
                <pre className="rounded-lg bg-surface p-space-sm font-currency-sm text-[12px] text-on-surface overflow-x-auto">{JSON.stringify(result.profile, null, 2)}</pre>
                <p className="text-[14px] text-slate-600">{result.privacyNote}</p>
                {!result.sharedWithAI && <p className="text-[13px] text-slate-500">Nothing was sent this time (a saved answer or the rule-based set was used). This is the profile that would be shared.</p>}
              </div>
            )}
          </div>
        </>
      )}

      <p className="text-[13px] leading-relaxed text-slate-500">
        Educational suggestions of product types, not advice on specific products. For personal advice, consult a SEBI-registered investment adviser or IRDAI-licensed insurance adviser.
      </p>
    </section>
  );
}
