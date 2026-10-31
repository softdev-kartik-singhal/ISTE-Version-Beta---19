// Trends card with the monthly cashflow chart, its legend and the 6-month totals strip.
import InfoTip from '../ui/InfoTip';
import { Wallet } from 'lucide-react';
import TrendsChart from '../charts/TrendsChart';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CashflowTrendCard({ cashflow }) {
  return (
    <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Money in, money out and left over</h2>
          <p className="font-body-sm text-body-sm text-secondary">Money in vs money out each month, and what was left over</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
            <span className="w-3 h-3 rounded-sm bg-primary-container inline-block" />
            <span>Money in</span>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
            <span className="w-3 h-3 rounded-sm bg-secondary inline-block" />
            <span>Outflow (Spend)</span>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            <span>Left over</span>
          </div>
        </div>
      </div>
      <div className="relative w-full overflow-x-auto pt-2">
        <div style={{ minWidth: '620px' }}>
          <TrendsChart months={cashflow.months} />
        </div>
      </div>
      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-secondary font-body-sm text-body-sm bg-surface-container-low px-space-md py-2.5 rounded-lg">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-primary" />
          <span className="text-on-surface font-semibold flex items-center gap-1">Money in, {cashflow.months.length} months: <InfoTip text="All credits in these months, leaving out transfers between your own accounts." /></span>
          <span className="font-currency-sm text-currency-sm text-on-surface">{formatCurrency(cashflow.totalInflow)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-on-surface font-semibold flex items-center gap-1">Money out, {cashflow.months.length} months: <InfoTip text="All debits in these months, leaving out transfers between your own accounts." /></span>
          <span className="font-currency-sm text-currency-sm text-on-surface">{formatCurrency(cashflow.totalOutflow)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-on-surface font-semibold flex items-center gap-1">Left over, {cashflow.months.length} months: <InfoTip text="Money in minus money out across these months." /></span>
          <span className="font-currency-sm text-currency-sm text-primary font-bold">{formatCurrency(cashflow.netSurplus)}</span>
        </div>
      </div>
    </div>
  );
}
