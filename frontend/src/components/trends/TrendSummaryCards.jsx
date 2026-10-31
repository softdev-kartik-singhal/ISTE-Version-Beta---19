// Trends top row: average monthly surplus, best month and toughest month cards.
import { Award, TrendingUp, TriangleAlert } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function TrendSummaryCards({ summary }) {
  const { average, best, toughest } = summary;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
      <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Average Monthly Surplus</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">6M Rolling</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-currency-hero text-currency-hero text-on-surface">{formatCurrency(average.amount)}</span>
            <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold flex items-center gap-0.5">
              <TrendingUp size={14} /> {average.change}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 flex items-center justify-between text-secondary">
          <span className="font-body-sm text-body-sm">vs trailing fiscal cycle</span>
          <span className="font-label-md text-label-md text-primary font-semibold">Healthy Surplus</span>
        </div>
      </div>
      <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Best Month</span>
            <Award size={20} className="text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-lg text-headline-lg text-on-surface">{best.month}</span>
            <span className="font-currency-md text-currency-md text-primary font-semibold">({formatCurrency(best.amount, { sign: true })})</span>
          </div>
        </div>
        <p className="mt-4 font-body-sm text-body-sm text-secondary leading-normal">{best.reason}</p>
      </div>
      <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Toughest Month</span>
            <TriangleAlert size={20} className="text-error" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-lg text-headline-lg text-on-surface">{toughest.month}</span>
            <span className="font-currency-md text-currency-md text-error font-semibold">({formatCurrency(toughest.amount)})</span>
          </div>
        </div>
        <p className="mt-4 font-body-sm text-body-sm text-secondary leading-normal">{toughest.reason}</p>
      </div>
    </div>
  );
}
