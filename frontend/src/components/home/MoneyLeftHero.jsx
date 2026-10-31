// Top of Home: greeting, the one big number (money left this month) and a status line with icon, colour and words.
import { CircleCheck, Gauge, TriangleAlert } from 'lucide-react';
import InfoTip from '../ui/InfoTip';
import { exact, rounded } from '../../utils/money';

const STATUS = {
  ok: { icon: CircleCheck, text: "You're on track", cls: 'bg-emerald-100 text-emerald-900', tip: 'Your usual balance stays above your safety buffer for the next 8 weeks.' },
  faster: { icon: Gauge, text: 'Spending faster than usual', cls: 'bg-amber-100 text-amber-900', tip: 'At this pace you would spend more than 10% above a usual month.' },
  tight: { icon: TriangleAlert, text: 'Tight this month', cls: 'bg-error-container text-on-error-container', tip: 'Money left is below zero, or your balance may dip under your safety buffer soon.' },
};

export default function MoneyLeftHero({ greeting, moneyLeft, daysLeft, status }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <section className="space-y-space-sm">
      <p className="font-body-lg text-body-lg text-secondary">{greeting}</p>
      <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display-lg text-display-lg-mobile lg:text-display-lg font-bold text-on-surface tracking-tight">{rounded(moneyLeft)}</span>
        <span className="font-headline-sm text-headline-sm text-secondary flex items-center gap-1.5">
          left this month
          <InfoTip text={`Expected income minus spending so far and bills still due. Exact: ${exact(moneyLeft)}, ${daysLeft} days to go.`} />
        </span>
      </h1>
      <p className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-label-md font-semibold ${s.cls}`}>
        <Icon size={16} />
        {s.text}
        <InfoTip text={s.tip} />
      </p>
    </section>
  );
}
