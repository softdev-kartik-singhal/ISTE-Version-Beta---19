// Dashboard card wrapping the 8-week cashflow projection chart with its legend and footnote.
import InfoTip from '../ui/InfoTip';
import { Info } from 'lucide-react';
import Card from '../ui/Card';
import CashflowProjectionChart from '../charts/CashflowProjectionChart';

export default function ProjectionCard({ projection }) {
  return (
    <Card className="p-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Your balance over the next 8 weeks</h3>
          <p className="font-body-sm text-body-sm text-secondary">Based on your usual income, spending and regular bills</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-secondary">
            <span className="w-3 h-0.5 bg-primary" />
            <span>Usual</span>
          </div>
          <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-secondary">
            <span className="w-3 h-2 rounded-sm bg-secondary-container/40" />
            <span>Low-to-high range</span>
          </div>
        </div>
      </div>
      <div className="relative w-full h-64 pt-2">
        <CashflowProjectionChart weeks={projection.weeks} runwayBuffer={projection.runwayBuffer} />
      </div>
      <div className="mt-4 pt-3 border-t border-[#E3E8EF] flex items-center justify-between text-secondary">
        <div className="flex items-center gap-1.5 text-label-sm font-label-sm">
          <Info size={16} className="text-primary" />
          <span>{projection.note}</span>
        </div>
        <span className="font-currency-sm text-currency-sm font-semibold text-on-surface flex items-center gap-1">
          {projection.minRunway}
          {projection.minRunway && <InfoTip text="The smallest week-end balance on the usual line above." />}
        </span>
      </div>
    </Card>
  );
}
