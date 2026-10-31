// One spending category in the grid: icon, name, amount and a "more / less than usual / usual" tag. Tap to open.
import Amount from '../ui/Amount';
import CompareTag from '../ui/CompareTag';
import { iconFor } from '../../utils/icons';

export default function CategoryCard({ category, selected, onSelect }) {
  const Icon = iconFor(category.icon);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`text-left p-space-md rounded-xl bg-surface-container-lowest shadow-sm border transition-all hover:shadow-md flex flex-col gap-2 ${selected ? 'border-primary-container ring-2 ring-primary-container/30' : 'border-[#E3E8EF]'}`}
    >
      <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
        <Icon size={18} />
      </span>
      <span className="font-body-md text-body-md text-on-surface">{category.name}</span>
      <Amount value={category.amount} className="font-currency-md text-currency-md font-semibold text-on-surface" />
      <CompareTag tag={category.tag} />
    </button>
  );
}
