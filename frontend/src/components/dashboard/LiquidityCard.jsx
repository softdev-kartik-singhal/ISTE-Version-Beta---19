// One of the four Dashboard key-metric cards (label, icon, big amount, badge, footer).
import Card from '../ui/Card';

export default function LiquidityCard({ label, icon: Icon, iconClass, value, valueClass = 'text-on-surface', badge, footer, tour }) {
  return (
    <Card className="p-5 flex flex-col justify-between" data-tour={tour}>
      <div>
        <div className="flex items-center justify-between text-secondary mb-2">
          <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">{label}</span>
          <Icon size={18} className={iconClass} />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span data-count className={`font-currency-hero text-currency-hero tracking-tight ${valueClass}`}>{value}</span>
          {badge}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#E3E8EF]/60">{footer}</div>
    </Card>
  );
}
