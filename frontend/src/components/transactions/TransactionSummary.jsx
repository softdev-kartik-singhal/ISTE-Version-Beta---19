// Transactions summary row: total inflows, outflows, net cash flow and items needing review.
import { ArrowDown, ArrowUp, ArrowUpDown, Flag, TriangleAlert } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function TransactionSummary({ summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
      <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Total Inflows</span>
          <span className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <ArrowDown size={16} />
          </span>
        </div>
        <div className="mt-space-sm">
          <div className="font-currency-hero text-currency-hero text-on-surface tracking-tight leading-none">
            {formatCurrency(summary.inflows, { sign: true })}
            <span className="text-currency-sm font-currency-sm text-secondary font-normal">.00 CR</span>
          </div>
          <p className="font-label-sm text-label-sm text-secondary mt-1.5 flex items-center gap-1">
            <span className="text-primary font-semibold">{summary.accounts} accounts</span> • {summary.creditCount} credits in {summary.month}
          </p>
        </div>
      </div>
      <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Total Outflows</span>
          <span className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-secondary">
            <ArrowUp size={16} />
          </span>
        </div>
        <div className="mt-space-sm">
          <div className="font-currency-hero text-currency-hero text-on-surface tracking-tight leading-none">
            {formatCurrency(-summary.outflows)}
            <span className="text-currency-sm font-currency-sm text-secondary font-normal">.00 DR</span>
          </div>
          <p className="font-label-sm text-label-sm text-secondary mt-1.5 flex items-center gap-1">
            <span>{summary.debitCount} debit transactions</span>
          </p>
        </div>
      </div>
      <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Net Cash Flow</span>
          <span className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <ArrowUpDown size={16} />
          </span>
        </div>
        <div className="mt-space-sm">
          <div className="font-currency-hero text-currency-hero text-primary tracking-tight leading-none">
            {formatCurrency(summary.inflows - summary.outflows, { sign: true })}
            <span className="text-currency-sm font-currency-sm text-secondary font-normal">.00</span>
          </div>
          <p className="font-label-sm text-label-sm text-secondary mt-1.5">{summary.retained} surplus retained this cycle</p>
        </div>
      </div>
      <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Items Needing Review</span>
          <span className="w-7 h-7 rounded-full bg-error-container text-error flex items-center justify-center">
            <Flag size={16} />
          </span>
        </div>
        <div className="mt-space-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-currency-hero text-currency-hero text-on-surface">{summary.unreviewedFlags}</span>
            <span className="font-label-sm text-label-sm text-secondary">unreviewed flags</span>
          </div>
          <p className="font-label-sm text-label-sm text-error mt-1.5 flex items-center gap-1 font-medium">
            <TriangleAlert size={14} />
            <span>{summary.duplicateSuspects} duplicate debit suspects</span>
          </p>
        </div>
      </div>
    </div>
  );
}
