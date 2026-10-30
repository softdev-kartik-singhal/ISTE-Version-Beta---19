// Small dark confirmation message shown at the bottom-centre of the screen.
import { CircleCheck } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-space-md py-3 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl font-body-sm text-body-sm font-medium">
      <CircleCheck size={18} className="text-primary-fixed" />
      <span>{message}</span>
    </div>
  );
}
