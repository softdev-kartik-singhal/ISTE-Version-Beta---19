// One of the four Dashboard key-metric cards (label with info tip, icon, big amount, badge, footer).
import InfoTip from '../ui/InfoTip';
import Card from '../ui/Card';

export default function LiquidityCard({ label, tip, icon: Icon, iconClass, value, valueClass = 'text-on-surface', badge, footer }) {
  return (
    <Card className="p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-secondary mb-2">
          <span className="font-label-md text-label-md uppercase tracking-wider text-secondary flex items-center gap-1">
            {label}
            {tip && <InfoTip text={tip} />}
          </span>
          <Icon size={18} className={iconClass} />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className={`font-currency-hero text-currency-hero tracking-tight ${valueClass}`}>{value}</span>
          {badge}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#E3E8EF]/60">{footer}</div>
    </Card>
  );
}
