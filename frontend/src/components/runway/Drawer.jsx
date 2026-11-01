// A panel that slides in from the right on wide screens and up from the bottom on phones (a bottom sheet).
// Escape, the close button or a click on the dimmed page closes it; focus moves into it when it opens.
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ open, title, onClose, children }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-[#0b2545]/40 backdrop-blur-[2px] sm:items-stretch" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside
        ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className="drawer-in max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl focus:outline-none sm:max-h-none sm:max-w-md sm:rounded-none"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[20px] font-bold text-[#0b2545]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="mt-5">{children}</div>
      </aside>
    </div>
  );
}
