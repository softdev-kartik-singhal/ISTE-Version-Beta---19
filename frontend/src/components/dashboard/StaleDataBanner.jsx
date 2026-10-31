// Home warning shown when the newest statement is over a month old, with one button to upload a fresh one.
import { TriangleAlert } from 'lucide-react';
import NextActionButton from '../ui/NextActionButton';

const STALE_AFTER_DAYS = 35; // a monthly statement plus a few days' grace

export default function StaleDataBanner({ asOf }) {
  const days = Math.floor((Date.now() - new Date(`${asOf.slice(0, 10)}T00:00:00`)) / 864e5);
  if (days <= STALE_AFTER_DAYS) return null;
  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm p-space-md rounded-xl bg-tertiary-fixed/40 border border-tertiary-fixed">
      <p className="flex items-start gap-2 font-body-md text-body-md text-on-surface">
        <TriangleAlert size={20} className="text-tertiary mt-0.5" />
        <span>Your newest statement is {days} days old, so these numbers may be out of date.</span>
      </p>
      <NextActionButton action={{ label: 'Upload latest statement', to: '/statements' }} />
    </section>
  );
}
