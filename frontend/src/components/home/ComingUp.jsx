// "Coming up": the next few regular payments as small chips (Rent ₹28,000 · Thu).
import { CalendarClock } from 'lucide-react';
import Amount from '../ui/Amount';

export default function ComingUp({ payments }) {
  if (!payments.length) return null;
  return (
    <section className="flex flex-wrap items-center gap-2">
      <h2 className="font-label-md text-label-md text-secondary flex items-center gap-1.5 mr-1">
        <CalendarClock size={16} /> Coming up
      </h2>
      {payments.map((p) => (
        <span key={p.id} className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-[#E3E8EF] font-label-md text-label-md text-on-surface">
          {p.name} <Amount value={p.amount} className="font-semibold" /> · {p.when}
        </span>
      ))}
    </section>
  );
}
