// The short answer on Ask: a big verdict badge, one sentence and one suggestion.
import { Lightbulb } from 'lucide-react';
import VerdictBadge from '../ui/VerdictBadge';

export default function AnswerSummary({ verdict }) {
  return (
    <section className="rounded-xl bg-surface-container-lowest shadow-sm border border-[#E3E8EF] p-space-lg space-y-space-sm" aria-live="polite">
      <VerdictBadge state={verdict.state} size="lg" />
      <p className="font-headline-sm text-headline-sm text-on-surface">{verdict.sentence}</p>
      <p className="flex items-center gap-2 font-body-md text-body-md text-secondary">
        <Lightbulb size={18} className="text-primary" /> {verdict.suggestion}
      </p>
    </section>
  );
}
