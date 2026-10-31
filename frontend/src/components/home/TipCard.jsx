// The single most useful thing to know this month, with one button to act on it.
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
import NextActionButton from '../ui/NextActionButton';

const TONES = {
  more: { icon: TrendingUp, cls: 'bg-amber-100 text-amber-900' },
  less: { icon: TrendingDown, cls: 'bg-emerald-100 text-emerald-900' },
  info: { icon: Lightbulb, cls: 'bg-surface-container text-primary' },
};

export default function TipCard({ tip }) {
  const t = TONES[tip.tone];
  const Icon = t.icon;
  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-[#E3E8EF]">
      <p className="flex items-center gap-3 font-body-md text-body-md text-on-surface">
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.cls}`}>
          <Icon size={18} />
        </span>
        {tip.text}
      </p>
      <NextActionButton action={tip.action} />
    </section>
  );
}
