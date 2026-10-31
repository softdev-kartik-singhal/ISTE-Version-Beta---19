// One way to use money left over, as a short card; "Learn more" opens what it is good for, lock-in and risk.
import { useState } from 'react';
import { ChevronDown, ShieldCheck, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';

export default function OptionCard({ option }) {
  const [open, setOpen] = useState(false);
  const RiskIcon = option.risk === 'Low' ? ShieldCheck : TrendingUp;
  return (
    <Card className="p-space-md space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-body-md text-body-md font-semibold text-on-surface">{option.title}</h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm whitespace-nowrap">
          <RiskIcon size={12} /> {option.risk} risk
        </span>
      </div>
      <button type="button" aria-expanded={open} className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold" onClick={() => setOpen(!open)}>
        Learn more <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <dl className="font-body-sm text-body-sm text-secondary space-y-1">
          <div><dt className="inline font-semibold text-on-surface">Good for: </dt><dd className="inline">{option.bestFor}</dd></div>
          <div><dt className="inline font-semibold text-on-surface">Locked for: </dt><dd className="inline">{option.lockIn}</dd></div>
          <div><dt className="inline font-semibold text-on-surface">Risk: </dt><dd className="inline">{option.riskDetail}</dd></div>
        </dl>
      )}
    </Card>
  );
}
