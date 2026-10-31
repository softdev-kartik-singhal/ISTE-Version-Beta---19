// The "+ Cash" quick-add button used in page headers (phones get the floating one from CashProvider).
import { Plus } from 'lucide-react';
import { useCash } from './cashContext';

export default function CashButton({ className = '' }) {
  const { openCash } = useCash();
  return (
    <button className={`h-10 px-space-md rounded-lg bg-primary-container text-white hover:bg-primary font-label-md text-label-md flex items-center gap-1.5 shadow-sm ${className}`} onClick={() => openCash()}>
      <Plus size={18} /> Cash
    </button>
  );
}
