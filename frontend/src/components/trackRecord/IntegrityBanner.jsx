// Banner showing whether the forecast log's hash chain is intact; if not, the first entry that no longer checks out.
import { BadgeCheck, ShieldX } from 'lucide-react';

export default function IntegrityBanner({ integrity }) {
  const broken = integrity.firstBroken;
  return broken ? (
    <div className="p-space-md rounded-xl bg-error-container text-on-error-container shadow-sm flex items-center gap-space-md">
      <div className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center shrink-0">
        <ShieldX size={24} />
      </div>
      <div>
        <h4 className="font-headline-sm text-headline-sm font-bold text-error">The log has been altered</h4>
        <p className="font-body-sm text-body-sm">
          Entry #{broken.entryId} (position {broken.position}, {broken.targetMonth}) fails the check. {broken.reason}
        </p>
      </div>
    </div>
  ) : (
    <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center gap-space-md">
      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
        <BadgeCheck size={24} />
      </div>
      <div>
        <span className="font-headline-sm text-headline-sm text-on-surface">All {integrity.entries} entries verified: nothing has been altered</span>
        <p className="font-body-sm text-body-sm text-secondary">
          Each entry carries a SHA-256 hash of its content and of the entry before it.{integrity.headHash && ` Latest hash: ${integrity.headHash.slice(0, 12)}…`}
        </p>
      </div>
    </div>
  );
}
