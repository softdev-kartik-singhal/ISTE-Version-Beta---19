// Track Record KPI row: forecast accuracy, average miss, cryptographic state and learning delta.
import InfoTip from '../ui/InfoTip';
import { BrainCircuit, Link, Target, TrendingDown } from 'lucide-react';

const ICONS = {
  target: { icon: Target, cls: 'bg-surface-container-low text-primary' },
  down: { icon: TrendingDown, cls: 'bg-tertiary-fixed text-tertiary' },
  link: { icon: Link, cls: 'bg-surface-variant text-primary' },
  brain: { icon: BrainCircuit, cls: 'bg-surface-container-low text-primary-container' },
};

export default function TrackRecordKpis({ kpis }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
      {kpis.map((kpi) => {
        const { icon: Icon, cls } = ICONS[kpi.icon];
        return (
          <div key={kpi.label} className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between space-y-space-md hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary flex items-center gap-1">
                {kpi.label}
                {kpi.tip && <InfoTip text={kpi.tip} />}
              </span>
              <span className={`p-2 rounded-lg ${cls}`}>
                <Icon size={20} />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`font-currency-hero text-currency-hero ${kpi.valueClass}`}>{kpi.value}</span>
                <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-medium ${kpi.chipClass}`}>{kpi.chip}</span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary mt-1">{kpi.note}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
