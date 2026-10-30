// One "What If" lever: icon, description, monthly impact and an on/off switch.
import ToggleSwitch from '../ui/ToggleSwitch';
import { iconFor } from '../../utils/icons';

export default function LeverRow({ lever, checked, onChange }) {
  const Icon = iconFor(lever.icon);
  return (
    <div className="flex items-center justify-between p-space-md rounded-xl bg-surface transition-all">
      <div className="flex items-center gap-space-sm">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lever.iconClass}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="font-body-md text-body-md font-semibold text-on-surface">{lever.title}</div>
          <div className="font-label-sm text-label-sm text-secondary">{lever.detail}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-currency-sm text-currency-sm font-semibold ${lever.impactClass}`}>{lever.impact}</span>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}
