// "Forecast Range vs. Actual Cashflow Outcome" section: legend, scale header and one row per month.
import ForecastMonthRow from './ForecastMonthRow';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ForecastComparison({ months, scaleMax }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * scaleMax);
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-xl shadow-sm space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Forecast Range vs. Actual Cashflow Outcome</h3>
          <p className="font-body-sm text-body-sm text-secondary">
            Visual analysis of trailing {months.length} months: Worst-case to Best-case bounds against verified bank balance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-md font-label-sm text-label-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 rounded-sm bg-surface-container-highest" />
            <span className="text-secondary">Predicted Range</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-secondary">Actual Settled Outcome</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-surface-tint" />
            <span className="text-secondary">Hit (Within Bounds)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
            <span className="text-secondary">Miss (Breached Bounds)</span>
          </div>
        </div>
      </div>
      <div className="space-y-space-md">
        <div className="hidden sm:grid grid-cols-12 gap-4 text-secondary font-currency-sm text-label-sm px-4">
          <div className="col-span-3">Forecast Horizon</div>
          <div className="col-span-6 flex justify-between">
            {ticks.map((t) => (
              <span key={t}>{formatCurrency(t)}</span>
            ))}
          </div>
          <div className="col-span-3 text-right">Model Outcome</div>
        </div>
        {months.map((m) => (
          <ForecastMonthRow key={m.month} month={m} scaleMax={scaleMax} />
        ))}
      </div>
    </div>
  );
}
