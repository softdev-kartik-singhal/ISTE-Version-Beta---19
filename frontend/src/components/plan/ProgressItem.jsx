// A goal (or the emergency fund) as a progress ring, its name and one line on what it needs.
import { TriangleAlert } from 'lucide-react';
import Card from '../ui/Card';
import ProgressRing from '../ui/ProgressRing';

export default function ProgressItem({ name, percent, line, warning }) {
  return (
    <Card className="p-space-md flex items-center gap-space-md">
      <ProgressRing percent={percent} label={name} />
      <div className="min-w-0">
        <h3 className="font-body-md text-body-md font-semibold text-on-surface">{name}</h3>
        <p className="font-body-sm text-body-sm text-secondary">{line}</p>
        {warning && (
          <p className="mt-1 inline-flex items-center gap-1 font-label-sm text-label-sm text-error">
            <TriangleAlert size={13} /> {warning}
          </p>
        )}
      </div>
    </Card>
  );
}
