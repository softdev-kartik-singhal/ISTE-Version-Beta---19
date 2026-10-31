// One of the three Money Flow insight cards (growing category, concentrated outflow, new merchants).
import { Link } from 'react-router-dom';
import { BadgePlus, ChartPie, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const BADGE_ICONS = { trending: TrendingUp, pie: ChartPie, new: BadgePlus };

export default function FlowInsightCard({ insight }) {
  const BadgeIcon = BADGE_ICONS[insight.badgeIcon];
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container p-space-md flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">{insight.label}</span>
          <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1 ${insight.badgeClass}`}>
            <BadgeIcon size={13} /> {insight.badge}
          </span>
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{insight.title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-currency-md text-currency-md font-bold text-on-surface">{formatCurrency(insight.amount)}</span>
          <span className="font-label-sm text-label-sm text-outline">{insight.amountNote}</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">{insight.detail}</p>
      </div>
      <div className="pt-3 mt-4 border-t border-surface-container flex items-center justify-between text-[12px]">
        <span className="text-on-surface-variant font-medium">{insight.footer}</span>
        <Link className="text-primary font-semibold hover:underline" to="/transactions" state={{ query: insight.query }}>
          {insight.action}
        </Link>
      </div>
    </div>
  );
}
