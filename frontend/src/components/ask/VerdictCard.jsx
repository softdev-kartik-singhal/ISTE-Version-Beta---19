// Ask verdict card: headline answer, engine confidence meter and four quick metrics.
import { Info, Shield } from 'lucide-react';

// Colours per verdict: amber for "only if", green for safe, red for risky.
const TONES = {
  caution: { pill: 'bg-amber-100 text-amber-900', icon: 'text-amber-700', label: 'text-amber-800', bar: 'bg-amber-500' },
  safe: { pill: 'bg-emerald-100 text-emerald-900', icon: 'text-emerald-700', label: 'text-emerald-800', bar: 'bg-emerald-500' },
  risk: { pill: 'bg-error-container text-on-error-container', icon: 'text-error', label: 'text-error', bar: 'bg-error' },
};

export default function VerdictCard({ verdict }) {
  const { confidence, metrics } = verdict;
  const tone = TONES[verdict.tone || 'caution'];
  return (
    <div data-tour="verdict" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md bg-surface-container-low/40 p-space-md rounded-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-label-md font-semibold ${tone.pill}`}>
              <Shield size={16} className={tone.icon} />
              <span>{verdict.status}</span>
            </span>
            <span className="font-label-sm text-label-sm text-secondary">{verdict.rule}</span>
          </div>
          <h2 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface font-bold tracking-tight">{verdict.headline}</h2>
          <p className="font-body-md text-body-md text-secondary">{verdict.summary}</p>
        </div>
        <div className="lg:w-80 shrink-0 bg-surface-container-lowest p-space-md rounded-lg shadow-sm space-y-2.5">
          <div className="flex items-center justify-between font-label-md text-label-md">
            <span className="text-secondary font-semibold">Engine Confidence</span>
            <span className={`${tone.label} font-semibold`}>{confidence.label}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 h-2.5 w-full">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${i < confidence.segments ? tone.bar : 'bg-surface-container'} rounded-full`} />
            ))}
          </div>
          <div className="font-label-sm text-label-sm text-secondary space-y-1">
            <div className="flex items-start gap-1">
              <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                Income varied <strong>{confidence.incomeVariance}</strong> {confidence.note}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md pt-space-xs">
        {metrics.map((m) => (
          <div key={m.label} className="p-space-md rounded-lg bg-surface space-y-1">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">{m.label}</span>
            <div className={`font-currency-md text-currency-md font-semibold ${m.valueClass}`}>{m.value}</div>
            <span className={`font-label-sm text-label-sm ${m.noteClass}`}>{m.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
