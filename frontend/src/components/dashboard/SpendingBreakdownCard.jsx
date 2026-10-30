// Dashboard "October Spending" card: donut, top-four legend and discretionary/fixed split.
import { ChartPie } from 'lucide-react';
import Card from '../ui/Card';
import SpendingDonut from '../charts/SpendingDonut';
import { formatCurrency } from '../../utils/formatCurrency';

export default function SpendingBreakdownCard({ spending }) {
  return (
    <Card className="p-space-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{spending.month} Spending</h3>
          <p className="font-body-sm text-body-sm text-secondary">
            {formatCurrency(spending.total)} across {spending.categoryCount} lifestyle categories
          </p>
        </div>
        <ChartPie size={20} className="text-secondary" />
      </div>
      <div className="flex items-center justify-center my-2">
        <SpendingDonut categories={spending.categories} total={spending.total} />
      </div>
      <div className="space-y-2 mt-2 divide-y divide-[#E3E8EF]/60 text-body-sm">
        {spending.categories.slice(0, 4).map((c) => (
          <div key={c.name} className="flex items-center justify-between pt-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="font-body-sm text-on-surface truncate">{c.name}</span>
            </div>
            <span className="font-currency-sm text-currency-sm text-on-surface font-medium">{formatCurrency(c.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2.5 border-t border-[#E3E8EF] flex items-center justify-between text-label-sm">
        <span className="text-secondary">Discretionary vs Fixed:</span>
        <span className="font-medium text-on-surface">{spending.split}</span>
      </div>
    </Card>
  );
}
