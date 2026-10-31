// "This month vs usual": one compact bar per top category, with a marker for the usual amount and a worded tag.
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Amount from '../ui/Amount';
import CompareTag from '../ui/CompareTag';
import { iconFor } from '../../utils/icons';
import { rounded } from '../../utils/money';

export default function CategoryBars({ bars, month }) {
  const max = Math.max(1, ...bars.flatMap((b) => [b.thisMonth, b.usual]));
  return (
    <Card className="p-space-lg space-y-space-md">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">This month vs usual</h2>
        <Link to="/spending" className="font-label-md text-label-md text-primary font-semibold hover:underline">All spending</Link>
      </div>
      {bars.length === 0 && <p className="font-body-sm text-body-sm text-secondary">Comparisons start after 4 months of statements.</p>}
      <ul className="space-y-3">
        {bars.map((b) => {
          const Icon = iconFor(b.icon);
          return (
            <li key={b.name} className="space-y-1">
              <div className="flex items-center justify-between gap-2 font-label-md text-label-md">
                <span className="flex items-center gap-2 text-on-surface">
                  <Icon size={16} className="text-secondary" /> {b.name}
                </span>
                <span className="flex items-center gap-2">
                  <Amount value={b.thisMonth} className="font-semibold text-on-surface" />
                  <CompareTag tag={b.tag} />
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-surface-container" aria-hidden="true">
                <div className="h-full rounded-full bg-primary-container" style={{ width: `${(b.thisMonth / max) * 100}%` }} />
                <div className="absolute -top-1 h-4 w-0.5 bg-on-surface" style={{ left: `${(b.usual / max) * 100}%` }} title={`Usual: ${rounded(b.usual)}`} />
              </div>
            </li>
          );
        })}
      </ul>
      {month && <p className="font-label-sm text-label-sm text-secondary">{month} · the line marks your usual month</p>}
    </Card>
  );
}
