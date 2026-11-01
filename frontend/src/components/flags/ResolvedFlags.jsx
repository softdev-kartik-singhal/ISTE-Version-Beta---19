// Collapsible "Resolved Flags" section listing recently resolved anomalies.
import { Archive, BadgeAlert, CarTaxiFront, ChevronDown, CircleCheck, Copy, Dumbbell, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const ICONS = { taxi: CarTaxiFront, fitness: Dumbbell, archive: Archive, duplicate: Copy, large: TrendingUp, 'new-merchant': BadgeAlert };

export default function ResolvedFlags({ resolved, open, onToggle }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
      <button className="w-full p-space-lg flex items-center justify-between text-left hover:bg-surface-container-low transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CircleCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Resolved Flags</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                {resolved.count} items resolved
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary">
              All {resolved.count} resolved flags have calibrated your future cashflow models and category classification rules.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md text-primary hidden sm:inline font-medium">Show history</span>
          <ChevronDown size={24} className={`text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-space-lg pb-space-lg space-y-space-md">
          <div className="space-y-space-xs">
            {resolved.items.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <div key={item.id || item.merchant} className="p-3 rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <Icon size={20} className="text-secondary" />
                    <div>
                      <span className="font-label-md text-label-md font-semibold text-on-surface">{item.merchant}</span>
                      <span className="text-secondary text-label-sm font-label-sm"> • {item.resolution}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-md">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-label-sm">{item.category}</span>
                    <span className="font-currency-sm font-semibold text-on-surface">{formatCurrency(item.amount, { decimals: 2 })} DR</span>
                    <span className="text-secondary font-label-sm text-label-sm">{item.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="pt-2 font-label-sm text-label-sm text-secondary">Resolutions automatically update the &quot;Can I afford...?&quot; safe ceiling algorithm.</p>
        </div>
      )}
    </div>
  );
}
