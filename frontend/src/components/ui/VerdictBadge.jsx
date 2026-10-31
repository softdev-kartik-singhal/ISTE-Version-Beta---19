// The one affordability verdict badge: three states, each with its own icon, colour and words (never colour alone).
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';

export const VERDICTS = {
  yes: { icon: CircleCheck, text: 'Yes, comfortably', cls: 'bg-emerald-100 text-emerald-900', iconCls: 'text-emerald-700' },
  typical: { icon: CircleAlert, text: 'Only if income is normal', cls: 'bg-amber-100 text-amber-900', iconCls: 'text-amber-700' },
  no: { icon: CircleX, text: 'Not next month', cls: 'bg-red-100 text-red-900', iconCls: 'text-red-700' },
};

const SIZES = {
  sm: { pill: 'px-2.5 py-0.5 text-[12px]', icon: 13 },
  md: { pill: 'px-3 py-1 text-[13px]', icon: 16 },
  lg: { pill: 'px-4 py-1.5 text-[16px]', icon: 22 },
};

// state: 'yes' | 'typical' | 'no'   size: 'sm' | 'md' | 'lg'
export default function VerdictBadge({ state, size = 'md' }) {
  const v = VERDICTS[state] || VERDICTS.no;
  const z = SIZES[size];
  const Icon = v.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${z.pill} ${v.cls}`}>
      <Icon size={z.icon} className={v.iconCls} aria-hidden="true" /> {v.text}
    </span>
  );
}
