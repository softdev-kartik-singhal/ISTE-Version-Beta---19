// Trends page title row with the period selector and Export Trends button.
import { CalendarDays, ChevronDown, Download } from 'lucide-react';

export default function TrendsHeader({ periods, period, onPeriodChange, onExport }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
      <div>
        <div className="flex items-center gap-space-xs">
          <span className="font-headline-lg text-headline-lg text-on-surface">Trends &amp; Surplus</span>
          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
            Multi-Stream
          </span>
        </div>
        <p className="font-body-md text-body-md text-secondary mt-0.5">
          Historical cashflow stability, surplus velocity, and multi-month category variances.
        </p>
      </div>
      <div className="flex items-center gap-space-sm self-start md:self-auto">
        <div className="relative inline-flex items-center bg-surface-container-lowest rounded-lg shadow-sm">
          <CalendarDays size={18} className="text-secondary ml-3" />
          <select
            className="appearance-none bg-transparent pl-2 pr-8 py-2 font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <ChevronDown size={18} className="text-secondary absolute right-2 pointer-events-none" />
        </div>
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-colors"
          onClick={onExport}
        >
          <Download size={18} className="text-secondary" />
          <span>Export Trends</span>
        </button>
      </div>
    </div>
  );
}
