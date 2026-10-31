// Up to two helpful suggestions the server worked out (move a date to free money, use a past bonus).
import { Lightbulb } from 'lucide-react';

export default function Nudges({ nudges }) {
  if (!nudges.length) return null;
  return (
    <section aria-label="Suggestions" className="grid gap-3 md:grid-cols-2">
      {nudges.map((n, i) => (
        <p key={n.text} className="goal-in flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-[15px] leading-relaxed text-slate-800" style={{ '--delay': `${i * 80}ms` }}>
          <Lightbulb size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" /> {n.text}
        </p>
      ))}
    </section>
  );
}
