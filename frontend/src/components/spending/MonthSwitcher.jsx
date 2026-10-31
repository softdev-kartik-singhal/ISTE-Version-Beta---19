// Previous / next month buttons around the month being shown.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel } from '../../services/adapters';

const BUTTON = 'p-2 rounded-lg text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent';

export default function MonthSwitcher({ months, month, onChange }) {
  const i = months.indexOf(month);
  return (
    <div className="inline-flex items-center gap-1 bg-surface-container-lowest rounded-xl shadow-sm border border-[#E3E8EF] p-1">
      <button type="button" aria-label="Previous month" className={BUTTON} disabled={i <= 0} onClick={() => onChange(months[i - 1])}>
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-36 text-center font-label-md text-label-md font-semibold text-on-surface">{monthLabel(month)}</span>
      <button type="button" aria-label="Next month" className={BUTTON} disabled={i >= months.length - 1} onClick={() => onChange(months[i + 1])}>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
