// Chapter 05: Suggestions for you. "About you" is a set of tappable chip groups (every field also has "Prefer not to say").
// The suggestions are a swipeable row of tall cards with a product-type icon on top. What was shared with the AI is a set of
// label chips. The server builds an anonymous profile and checks the AI's answer; this only displays it. The server also
// guarantees a suggestion never talks about a fact the user did not give.
import { useEffect, useRef, useState } from 'react';
import {
  CalendarClock, ChevronLeft, ChevronRight, ChevronDown, CircleCheck, ClipboardCheck, Droplets, Flower2, Gauge, HandCoins, HeartPulse,
  Landmark, LoaderCircle, Lock, PiggyBank, RefreshCw, ShieldCheck, Sparkles, Sunset, TrendingUp, TriangleAlert, Umbrella,
} from 'lucide-react';
import Chapter from './Chapter';
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
  high: { icon: TriangleAlert, cls: 'bg-red-50 text-red-800', text: 'Higher risk' },
};
const STAGES = ['Building your private profile', 'Asking the AI', 'Checking suggestions'];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sentence = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// The saved answer (true/false/string) <-> the chip's text value; '' = Prefer not to say.
const toText = (field, v) => (v === undefined || v === null ? '' : field.bool ? (v ? 'yes' : 'no') : v);
const fromText = (field, text) => (text === '' ? null : field.bool ? text === 'yes' : text);

// 'fixed deposit (under 1 year)' -> 'Fixed deposit' + 'Under 1 year'.
function splitName(name) {
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { title: sentence(m[1]), detail: sentence(m[2]) } : { title: sentence(name), detail: '' };
}

const PRODUCT_ICONS = [
  [/debt first/i, HandCoins], [/sweep/i, Droplets], [/recurring/i, PiggyBank], [/fixed deposit/i, Landmark], [/life/i, Umbrella],
  [/health/i, HeartPulse], [/debt\/liquid/i, Droplets], [/ppf/i, Landmark], [/nps/i, Sunset], [/sukanya/i, Flower2], [/index|sip/i, TrendingUp],
];
const iconFor = (product) => (PRODUCT_ICONS.find(([re]) => re.test(product)) || [null, Sparkles])[1];

const PROFILE_LABELS = {
  monthly_surplus_band: 'Monthly surplus', income_stability: 'Income', emergency_fund_status: 'Emergency fund', has_emi: 'Has an EMI',
  high_cost_debt_signal: 'Costly debt signal',
};
const ABOUT_LABELS = Object.fromEntries(FIELDS.map((f) => [f.name, f.label]));
const show = (v) => (v === true ? 'yes' : v === false ? 'no' : v);

// The anonymous profile as label chips.
function profileChips(profile) {
  const chips = Object.entries(PROFILE_LABELS).filter(([k]) => k in profile).map(([k, label]) => [label, show(profile[k])]);
  (profile.goals || []).forEach((g, i) => chips.push([`Goal ${i + 1}`, `${g.type} · ${g.horizon}`]));
  const c = profile.existing_cover_signals || {};
  if ('has_life_insurance_premium' in c) chips.push(['Life insurance premium', show(c.has_life_insurance_premium)]);
  if ('has_health_insurance_premium' in c) chips.push(['Health insurance premium', show(c.has_health_insurance_premium)]);
  Object.entries(profile.about_you || {}).forEach(([k, v]) => chips.push([ABOUT_LABELS[k] || k, show(v)]));
  return chips;
}

// One option of a segmented control: small, with "Prefer not to say" shown quietly (it is not a real choice, so no blue).
function Chip({ on, quiet = false, children, onClick }) {
  const active = quiet ? 'bg-white text-slate-700 shadow-sm' : 'bg-[#1d4ed8] text-white shadow-sm';
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`h-8 rounded-lg px-3 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40 ${on ? active : quiet ? 'text-slate-500 hover:bg-white/70' : 'text-slate-700 hover:bg-white/70'}`}>
      {children}
    </button>
  );
}

function SuggestionCard({ s, index }) {
  const risk = RISK[s.risk_level] || RISK.low;
  const Icon = iconFor(s.product_type);
  const { title, detail } = splitName(s.product_type);
  return (
    <article className="pop-in flex min-h-[420px] w-[300px] shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:w-[340px]" style={{ '--delay': `${index * 80}ms` }}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1d4ed8]"><Icon size={27} aria-hidden="true" /></span>
        <span className="rounded-full bg-[#0b2545] px-3 py-1 text-[13px] font-bold text-white">Priority {s.priority}</span>
      </div>
      <h3 className="mt-5 text-[22px] font-extrabold leading-tight text-[#0b2545]">{title}</h3>
      {detail && <p className="mt-0.5 text-[14px] text-slate-500">{detail}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${risk.cls}`}><risk.icon size={14} aria-hidden="true" /> {risk.text}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[13px] font-semibold text-slate-700"><CalendarClock size={14} aria-hidden="true" /> Suits goals {s.suits_goal_horizon}</span>
      </div>
      <div className="mt-5 space-y-4">
        <section>
          <h4 className="flex items-center gap-2 text-[14px] font-bold text-[#0b2545]"><CircleCheck size={16} className="text-emerald-600" aria-hidden="true" /> Why this fits you</h4>
          <p className="mt-1 pl-6 text-[15px] leading-relaxed text-slate-700">{s.why_it_fits}</p>
        </section>
        <section>
          <h4 className="flex items-center gap-2 text-[14px] font-bold text-[#0b2545]"><ClipboardCheck size={16} className="text-[#1d4ed8]" aria-hidden="true" /> Check before choosing</h4>
          <p className="mt-1 pl-6 text-[15px] leading-relaxed text-slate-700">{s.what_to_check}</p>
        </section>
      </div>
    </article>
  );
}

export default function SuggestionsChapter() {
  const [about, setAbout] = useState({});
  const [stage, setStage] = useState(-1); // -1 = not loading, otherwise the index in STAGES
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showShared, setShowShared] = useState(false);
  const track = useRef(null);

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

  const scrollBy = (dir) => track.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });
  const busy = stage >= 0;
  return (
    <Chapter n="05" id="suggestions" title="Suggestions for you">
      <p className="-mt-4 mb-8 max-w-2xl text-[16px] text-slate-600">Product types that fit your situation, picked from a private profile of labels and bands.</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[16px] font-bold text-[#0b2545]">About you <span className="font-normal text-slate-500">(optional)</span></p>
          <button type="button" disabled={busy} onClick={() => run(false)} className="flex h-10 items-center gap-2 rounded-full bg-[#1d4ed8] px-5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#1e40af] disabled:opacity-60">
            {busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            <span>{busy ? STAGES[stage] : result ? 'Update suggestions' : 'Get suggestions'}</span>
          </button>
        </div>
        <div className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.name} role="group" aria-label={f.label}>
              <p className="mb-1.5 text-[12px] font-semibold text-slate-500">{f.label}</p>
              <div className="inline-flex flex-wrap gap-0.5 rounded-xl bg-slate-100 p-1">
                {f.options.map((o) => <Chip key={o} on={toText(f, about[f.name]) === o} onClick={() => setAbout({ ...about, [f.name]: fromText(f, o) })}>{sentence(o)}</Chip>)}
                <Chip quiet on={toText(f, about[f.name]) === ''} onClick={() => setAbout({ ...about, [f.name]: null })}>Prefer not to say</Chip>
              </div>
            </div>
          ))}
        </div>
        {busy && (
          <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px]" aria-live="polite">
            {STAGES.map((st, i) => <li key={st} className={i <= stage ? 'font-semibold text-[#1d4ed8]' : 'text-slate-400'}>{i + 1}. {st}</li>)}
          </ol>
        )}
        {error && <p role="alert" className="mt-3 text-[14px] text-red-700">{error}</p>}
      </div>

      {result?.insufficientHistory && <p className="mt-6 text-[15px] text-slate-600">Upload at least one complete month of statements to get suggestions.</p>}

      {result && !result.insufficientHistory && (
        <>
          <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-slate-600">{result.source === 'rules' ? result.note : result.cached ? 'AI suggestions (saved from an earlier request)' : 'AI suggestions, checked by our rules'}</p>
            <div className="flex items-center gap-3">
              <button type="button" disabled={busy} onClick={() => run(true)} className="flex items-center gap-1.5 text-[14px] font-semibold text-[#1d4ed8] hover:underline disabled:opacity-60"><RefreshCw size={15} aria-hidden="true" /> Refresh suggestions</button>
              <span className="hidden gap-2 md:flex">
                <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous suggestions" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white hover:bg-slate-50"><ChevronLeft size={19} aria-hidden="true" /></button>
                <button type="button" onClick={() => scrollBy(1)} aria-label="Next suggestions" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white hover:bg-slate-50"><ChevronRight size={19} aria-hidden="true" /></button>
              </span>
            </div>
          </div>

          <div ref={track} className="carousel -mx-4 mt-5 flex gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0" role="region" aria-label="Suggestions, swipe sideways" tabIndex={0}>
            {result.suggestions.map((s, i) => <SuggestionCard key={s.product_type} s={s} index={i} />)}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <button type="button" onClick={() => setShowShared(!showShared)} aria-expanded={showShared} className="flex w-full items-center justify-between px-5 py-4 text-[15px] font-semibold text-[#0b2545]">
              <span className="flex items-center gap-2"><Lock size={17} className="text-[#1d4ed8]" aria-hidden="true" /> What we shared with the AI</span>
              <ChevronDown size={19} className={`transition-transform ${showShared ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {showShared && (
              <div className="space-y-4 px-5 pb-5">
                <ul className="flex flex-wrap gap-2" aria-label="The labels that were shared">
                  {profileChips(result.profile).map(([label, value]) => (
                    <li key={label} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-[13px] text-slate-700">{label}: <strong className="font-semibold text-[#0b2545]">{String(value)}</strong></li>
                  ))}
                </ul>
                <p className="text-[14px] leading-relaxed text-slate-600">{result.privacyNote}</p>
                {!result.sharedWithAI && <p className="text-[13px] text-slate-500">Nothing was sent this time (a saved answer or the rule-based set was used). This is the profile that would be shared.</p>}
              </div>
            )}
          </div>
        </>
      )}

      <p className="mt-8 text-[13px] leading-relaxed text-slate-500">
        Educational suggestions of product types, not advice on specific products. For personal advice, consult a SEBI-registered investment adviser or IRDAI-licensed insurance adviser.
      </p>
    </Chapter>
  );
}
