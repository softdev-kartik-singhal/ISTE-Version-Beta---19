// "Coming up this week" list of scheduled debits and mandates on the Dashboard.
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Clock } from 'lucide-react';
import Card from '../ui/Card';
import { iconFor } from '../../utils/icons';
import { formatCurrency } from '../../utils/formatCurrency';

const BADGE_TONES = {
  warning: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  neutral: 'bg-surface-container text-secondary',
};
const STATUS_ICONS = { clock: Clock, check: Check };

export default function UpcomingPayments({ payments }) {
  return (
    <Card as="section" className="p-space-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Coming up this week</h3>
          <p className="font-body-sm text-body-sm text-secondary">Scheduled debits and mandates active in the next 7 days</p>
        </div>
        <Link className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1" to="/transactions">
          <span>View all scheduled payments</span>
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="divide-y divide-[#E3E8EF]/60">
        {payments.map((p) => {
          const Icon = iconFor(p.icon);
          const StatusIcon = STATUS_ICONS[p.statusIcon];
          return (
            <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <Icon size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-body-md font-semibold text-on-surface">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded text-label-sm font-label-sm ${BADGE_TONES[p.badgeTone]}`}>{p.badge}</span>
                  </div>
                  <p className="text-secondary font-label-sm text-label-sm">{p.detail}</p>
                </div>
              </div>
              <div className="flex items-center sm:justify-end gap-3">
                <span className="font-currency-md text-currency-md font-semibold text-on-surface">{formatCurrency(p.amount)}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-secondary">
                  <StatusIcon size={12} className="text-primary" /> {p.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
