// One month in "Forecast Range vs. Actual": label, range chart with actual outcome, and the result summary.
import ForecastRangeBar from '../charts/ForecastRangeBar';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ForecastMonthRow({ month, scaleMax }) {
  const hit = month.actual >= month.low && month.actual <= month.high;
  const tooltip = hit
    ? `Actual: ${formatCurrency(month.actual)} (Range: ₹${month.low / 1000}k - ₹${month.high / 1000}k)`
    : `Actual: ${formatCurrency(month.actual)} (Lower bound: ${formatCurrency(month.low)})`;

  return (
    <div className="p-space-md rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low transition-colors space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4">
      <div className="sm:col-span-3 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-headline-sm text-headline-sm text-on-surface">{month.month}</span>
          <span
            className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
              hit ? 'text-primary bg-surface-variant' : 'text-tertiary bg-tertiary-fixed'
            }`}
          >
            {hit ? 'Within Range' : 'Missed'}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-secondary">Query: {month.query}</p>
      </div>
      <div className="sm:col-span-6 relative py-3">
        <ForecastRangeBar low={month.low} high={month.high} actual={month.actual} max={scaleMax} hit={hit} tooltip={tooltip} />
        <div className="flex justify-between text-secondary font-currency-sm text-label-sm mt-1">
          <span>
            Bound: {formatCurrency(month.low)} - {formatCurrency(month.high)}
          </span>
          <span className={`${hit ? 'text-primary' : 'text-tertiary'} font-semibold`}>Actual: {formatCurrency(month.actual)}</span>
        </div>
      </div>
      <div className="sm:col-span-3 text-left sm:text-right">
        <span
          className={`inline-block px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${
            hit ? 'bg-surface-container-high text-primary' : 'bg-tertiary-fixed text-tertiary'
          }`}
        >
          {month.outcome}
        </span>
        <p className="font-body-sm text-body-sm text-secondary mt-0.5">{month.note}</p>
      </div>
    </div>
  );
}
