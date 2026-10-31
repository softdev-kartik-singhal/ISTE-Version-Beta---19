// "Show how" expander: keeps the full working out (tables, charts, what-ifs) one tap away instead of on screen.
import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ShowHow({ label = 'Show how', hideLabel = 'Hide details', children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="space-y-space-md">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:underline"
        onClick={() => setOpen(!open)}
      >
        {open ? hideLabel : label}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={id} className="space-y-space-lg">
          {children}
        </div>
      )}
    </div>
  );
}
