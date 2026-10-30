// Surplus Plan Step 2 card describing one common savings/investment option (risk, lock-in, best use).
import { ChartLine, FileSearch, Landmark, Lock, Scale, Shield, SlidersHorizontal } from 'lucide-react';

const ICONS = { bank: Landmark, ppf: FileSearch, chart: ChartLine, scale: Scale };
const BADGE_ICONS = { shield: Shield, lock: Lock, chart: ChartLine, sliders: SlidersHorizontal };

export default function OptionCard({ option }) {
  const Icon = ICONS[option.icon];
  const BadgeIcon = BADGE_ICONS[option.badgeIcon];
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <Icon size={22} />
          </div>
          <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold flex items-center gap-1 ${option.badgeClass}`}>
            <BadgeIcon size={13} /> {option.badge}
          </span>
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{option.title}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed min-h-[54px]">{option.description}</p>
        </div>
        <div className="flex flex-col gap-2 pt-2 bg-surface-container-low p-3 rounded-lg">
          <div className="flex flex-col">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Typical Lock-in</span>
            <span className="font-body-sm text-body-sm text-on-surface font-medium">{option.lockIn}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Best Applied For</span>
            <span className="font-body-sm text-body-sm text-on-surface font-medium">{option.bestFor}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
        <span>{option.footerLabel}</span>
        <span className="font-semibold text-primary">{option.footerValue}</span>
      </div>
    </div>
  );
}
