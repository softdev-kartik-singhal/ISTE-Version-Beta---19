// Small (i) button; hovering or focusing it shows one line explaining the number next to it.
import { Info } from 'lucide-react';

export default function InfoTip({ text, light = false }) {
  return (
    <span className="relative inline-flex group align-middle normal-case tracking-normal">
      <button type="button" aria-label={text} className={`${light ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-[#1d4ed8]'} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] rounded-full`}>
        <Info size={14} />
      </button>
      <span role="tooltip" className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 max-w-[80vw] px-3 py-2 rounded-lg bg-[#0b2545] text-white text-[12px] leading-snug font-normal text-left shadow-lg hidden group-hover:block group-focus-within:block z-40">
        {text}
      </span>
    </span>
  );
}
