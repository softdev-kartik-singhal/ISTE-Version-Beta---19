// "On track" / "Tight" / "Spending faster than usual": icon + words, never colour alone.
import { CircleCheck, Gauge, TriangleAlert } from 'lucide-react';

export const STATUS = {
  ok: { icon: CircleCheck, text: 'On track', lead: "You're on track", cls: 'bg-emerald-400/20 text-emerald-50 ring-emerald-300/40' },
  faster: { icon: Gauge, text: 'Spending faster than usual', lead: "You're spending faster than usual", cls: 'bg-amber-400/20 text-amber-50 ring-amber-300/40' },
  tight: { icon: TriangleAlert, text: 'Tight', lead: "It's tight this month", cls: 'bg-red-400/25 text-red-50 ring-red-300/40' },
};

export default function StatusPill({ status }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold ring-1 ${s.cls}`}>
      <Icon size={15} aria-hidden="true" /> {s.text}
    </span>
  );
}
