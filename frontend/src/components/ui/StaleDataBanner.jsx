// Warning shown on Home and Ask when the newest statement ends more than 7 days before today:
// "Your latest statement ends 28 Sep 2026. Upload October 2026 to update."
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';

const STALE_AFTER_DAYS = 7;

// asOf: ISO date of the last statement row (yyyy-mm-dd)
export default function StaleDataBanner({ asOf }) {
  const end = new Date(`${asOf.slice(0, 10)}T00:00:00`);
  const days = Math.floor((Date.now() - end) / 864e5);
  if (days <= STALE_AFTER_DAYS) return null;
  const next = new Date(end.getFullYear(), end.getMonth() + 1, 1);
  const endText = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const nextText = next.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return (
    <div role="status" className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm p-space-md rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
      <p className="flex items-start gap-2 font-body-md text-body-md">
        <TriangleAlert size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <span>
          Your latest statement ends {endText}. Upload {nextText} to update.
        </span>
      </p>
      <Link to="/statements" className="shrink-0 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold">
        Upload statement
      </Link>
    </div>
  );
}
