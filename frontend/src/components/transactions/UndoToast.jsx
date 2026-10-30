// Bottom-right confirmation toast after a bulk category change, with Undo and dismiss.
import { CircleCheck, X } from 'lucide-react';

export default function UndoToast({ message, onUndo, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-space-md px-space-md py-3 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl">
      <div className="flex items-center gap-2">
        <CircleCheck size={20} className="text-primary-fixed" />
        <span className="font-body-sm text-body-sm font-medium">{message}</span>
      </div>
      <div className="flex items-center gap-space-sm pl-2">
        <button
          className="px-2.5 py-1 rounded bg-inverse-on-surface/10 hover:bg-inverse-on-surface/20 text-inverse-on-surface font-label-md text-label-md transition-colors"
          onClick={onUndo}
        >
          Undo
        </button>
        <button className="p-1 rounded text-inverse-on-surface/60 hover:text-inverse-on-surface transition-colors" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
