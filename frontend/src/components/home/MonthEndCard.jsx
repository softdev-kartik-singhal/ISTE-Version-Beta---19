// Small forecast card: the likely range for your total balance at the end of this month.
import { CalendarCheck } from 'lucide-react';
import Card from '../ui/Card';
import InfoTip from '../ui/InfoTip';
import { exact } from '../../utils/money';

export default function MonthEndCard({ range }) {
  return (
    <Card className="p-space-lg space-y-2">
      <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
        <CalendarCheck size={20} className="text-primary" /> End of month
      </h2>
      {range ? (
        <p className="font-body-lg text-body-lg text-on-surface flex flex-wrap items-center gap-1">
          You&apos;ll likely end the month with <strong>{range.text}</strong>
          <InfoTip text={`Your total balance across accounts if income is low (${exact(range.low)}) or high (${exact(range.high)}).`} />
        </p>
      ) : (
        <p className="font-body-sm text-body-sm text-secondary">A forecast needs 3 complete months of statements.</p>
      )}
    </Card>
  );
}
