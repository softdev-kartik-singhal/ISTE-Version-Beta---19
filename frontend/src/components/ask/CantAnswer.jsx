// "Can't answer yet": one sentence on why, and one button to fix it.
import { CircleHelp } from 'lucide-react';
import NextActionButton from '../ui/NextActionButton';

export default function CantAnswer({ reason }) {
  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm rounded-xl bg-surface-container-lowest shadow-sm border border-[#E3E8EF] p-space-lg">
      <p className="flex items-start gap-2 font-body-md text-body-md text-on-surface">
        <CircleHelp size={20} className="text-amber-700 mt-0.5" />
        <span>I can&apos;t answer this yet. {reason}</span>
      </p>
      <NextActionButton action={{ label: 'Upload 1 more month', to: '/statements' }} />
    </section>
  );
}
