// The one affordability verdict badge used everywhere: three states, each with its own icon, colour and words,
// plus an optional "What would change this" line underneath.
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';

const STATES = {
  yes: { icon: CircleCheck, text: 'Yes', cls: 'bg-emerald-100 text-emerald-900', iconCls: 'text-emerald-700' },
  typical: { icon: CircleAlert, text: 'Only if income is normal', cls: 'bg-amber-100 text-amber-900', iconCls: 'text-amber-700' },
  no: { icon: CircleX, text: 'Not next month', cls: 'bg-error-container text-on-error-container', iconCls: 'text-error' },
};

const SIZES = {
  md: { pill: 'px-3 py-1 font-label-md text-label-md', icon: 16 },
  lg: { pill: 'px-5 py-2 font-headline-sm text-headline-sm', icon: 26 },
};

// state: 'yes' | 'typical' | 'no'   change: the "What would change this" sentence (optional)   size: 'md' | 'lg'
export default function VerdictBadge({ state, change, size = 'md' }) {
  const s = STATES[state] || STATES.no;
  const z = SIZES[size];
  const Icon = s.icon;
  return (
    <div className="space-y-1.5">
      <span className={`inline-flex items-center gap-2 rounded-full font-semibold ${z.pill} ${s.cls}`}>
        <Icon size={z.icon} className={s.iconCls} />
        <span>{s.text}</span>
      </span>
      {change && (
        <p className="font-body-sm text-body-sm text-secondary">
          <span className="font-semibold text-on-surface">What would change this: </span>
          {change}
        </p>
      )}
    </div>
  );
}
