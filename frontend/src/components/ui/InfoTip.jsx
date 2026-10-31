// Small "i" next to a number; hovering or focusing it shows one line on how that number is calculated.
import { Info } from 'lucide-react';

export default function InfoTip({ text }) {
  return (
    <span className="relative inline-flex group align-middle normal-case tracking-normal">
      <button type="button" aria-label={text} className="text-outline hover:text-primary focus:text-primary focus:outline-none">
        <Info size={14} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-60 max-w-[80vw] px-2.5 py-1.5 rounded-md bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm font-normal text-left shadow-md hidden group-hover:block group-focus-within:block z-30"
      >
        {text}
      </span>
    </span>
  );
}
