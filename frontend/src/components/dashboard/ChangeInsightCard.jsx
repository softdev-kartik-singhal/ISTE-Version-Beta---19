// One "What changed this month" insight card on the Dashboard.
import Card from '../ui/Card';
import NextActionButton from '../ui/NextActionButton';
import { iconFor } from '../../utils/icons';

const TONES = {
  warning: { icon: 'bg-tertiary-fixed/40 text-tertiary', badge: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  positive: { icon: 'bg-emerald-400/10 text-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400' },
  neutral: { icon: 'bg-surface-container text-primary', badge: 'bg-surface-container text-secondary' },
};

export default function ChangeInsightCard({ insight }) {
  const Icon = iconFor(insight.icon);
  const tone = TONES[insight.tone];
  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone.icon}`}>
            <Icon size={18} />
          </span>
          <span className={`px-2 py-0.5 rounded text-label-sm font-semibold ${tone.badge}`}>{insight.badge}</span>
        </div>
        <p className="font-body-md font-medium text-on-surface leading-snug pt-1">{insight.title}</p>
        <p className="font-body-sm text-body-sm text-secondary">{insight.detail}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-[#E3E8EF]/60">
        <NextActionButton action={insight.action} />
      </div>
    </Card>
  );
}
