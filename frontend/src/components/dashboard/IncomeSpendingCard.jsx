// Dashboard card for "Income vs Spending (Last 6 Months)" with legend and savings summary.
import InfoTip from '../ui/InfoTip';
import Card from '../ui/Card';
import IncomeSpendingChart from '../charts/IncomeSpendingChart';

export default function IncomeSpendingCard({ data }) {
  return (
    <Card className="p-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Income vs Spending (Last 6 Months)</h3>
          <p className="font-body-sm text-body-sm text-secondary">Money in against everyday spending and regular bills</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-secondary">
            <span className="w-3 h-3 rounded-sm bg-[#0B2545]" />
            <span>Total Inflow</span>
          </div>
          <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-secondary">
            <span className="w-3 h-3 rounded-sm bg-outline-variant" />
            <span>Total Outflow</span>
          </div>
        </div>
      </div>
      <div className="h-44">
        <IncomeSpendingChart months={data.months} />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3 pt-2">
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-secondary flex items-center gap-1">Average saved per month: <InfoTip text="Money in minus money out for each of the last 6 months, averaged." /></span>
          <span className="font-currency-sm text-currency-sm font-semibold text-on-surface">{data.averageNetSavings}</span>
        </div>
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-secondary flex items-center gap-1">Share of income saved: <InfoTip text="Total saved over the last 6 months divided by total money in." /></span>
          <span className="font-currency-sm text-currency-sm font-semibold text-on-surface">{data.savingsRate}</span>
        </div>
      </div>
    </Card>
  );
}
