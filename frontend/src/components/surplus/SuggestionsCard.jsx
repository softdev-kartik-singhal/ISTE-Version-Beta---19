// "Suggestions for you": an optional About-you form, then AI-assisted product-type suggestions.
// The server builds an anonymous profile (bands and labels only) and checks the AI's answer; this card only displays it.
import { useEffect, useState } from 'react';
import { ChevronDown, Gauge, LoaderCircle, Lock, RefreshCw, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
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
const SELECT = 'h-10 pl-3 pr-8 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-container';
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
          <p className="font-body-sm text-body-sm text-secondary">Product types that fit your situation, picked from a private profile of labels and bands.</p>
        </div>
      </div>

      <div className="rounded-lg bg-surface-container-low/60 p-space-md space-y-space-sm">
        <p className="font-label-md text-label-md text-on-surface font-semibold">About you <span className="font-normal text-secondary">(optional)</span></p>
        <div className="flex flex-wrap gap-space-md">
          {FIELDS.map((f) => (
            <label key={f.name} className="flex flex-col gap-1 font-label-sm text-label-sm text-secondary">
              {f.label}
              <select className={SELECT} value={toText(f, about[f.name])} onChange={(e) => setAbout({ ...about, [f.name]: fromText(f, e.target.value) })}>
                <option value="">Prefer not to say</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </div>
        <button className="h-10 px-space-lg rounded-lg bg-primary-container text-white hover:bg-primary font-label-md text-label-md flex items-center gap-2 shadow-sm disabled:opacity-60" disabled={busy} onClick={() => run(false)}>
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
          <span>{busy ? STAGES[stage] : result ? 'Update suggestions' : 'Get suggestions'}</span>
        </button>
        {busy && (
          <ol className="flex flex-wrap gap-x-space-md gap-y-1 font-label-sm text-label-sm">
            {STAGES.map((s, i) => (
              <li key={s} className={i <= stage ? 'text-primary font-semibold' : 'text-outline'}>{i + 1}. {s}</li>
            ))}
          </ol>
        )}
        {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
      </div>

      {result?.insufficientHistory && (
        <p className="font-body-sm text-body-sm text-secondary">Upload at least one complete month of statements to get suggestions.</p>
      )}

      {result && !result.insufficientHistory && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <p className="font-label-sm text-label-sm text-secondary">
              {result.source === 'rules' ? result.note : result.cached ? 'AI suggestions (saved from an earlier request)' : 'AI suggestions, checked by our rules'}
            </p>
            <button className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1 disabled:opacity-60" disabled={busy} onClick={() => run(true)}>
              <RefreshCw size={15} /> Refresh suggestions
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
            {result.suggestions.map((s) => {
              const risk = RISK[s.risk_level] || RISK.low;
              return (
                <article key={s.product_type} className="rounded-xl bg-surface-container-low/50 p-space-md space-y-space-sm">
                  <div className="flex items-start justify-between gap-space-sm">
                    <h3 className="font-headline-sm text-[16px] text-on-surface font-semibold">{s.product_type}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary-container text-white font-label-sm text-label-sm shrink-0">Priority {s.priority}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${risk.cls}`}><risk.icon size={13} /> {risk.text}</span>
                  <div>
                    <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Why this fits you</p>
                    <p className="font-body-sm text-body-sm text-on-surface">{s.why_it_fits}</p>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">What to check before choosing</p>
                    <p className="font-body-sm text-body-sm text-on-surface">{s.what_to_check}</p>
                  </div>
                  <p className="font-label-sm text-label-sm text-secondary">Suits goals: {s.suits_goal_horizon}</p>
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
                <p className="font-body-sm text-body-sm text-secondary">{result.privacyNote}</p>
                {!result.sharedWithAI && <p className="font-label-sm text-label-sm text-secondary">Nothing was sent this time (a saved answer or the rule-based set was used). This is the profile that would be shared.</p>}
              </div>
            )}
          </div>
        </>
      )}

      <p className="font-label-sm text-label-sm text-on-surface-variant">
        Educational suggestions of product types, not advice on specific products. For personal advice, consult a SEBI-registered investment adviser or IRDAI-licensed insurance adviser.
      </p>
    </section>
  );
}
