// Phone screen for the Security section: "Confirm with your card", a pulsing card, then a green Verified tick.
import { useEffect, useState } from 'react';
import { CircleCheck, CreditCard } from 'lucide-react';
import { useReducedMotion } from '../landingHooks';

export default function CardScreen() {
  const reduced = useReducedMotion();
  const [verified, setVerified] = useState(reduced);
  useEffect(() => {
    if (reduced) return undefined;
    const t = setTimeout(() => setVerified(true), 1400);
    return () => clearTimeout(t);
  }, [reduced]);
  return (
    <div className="flex flex-col items-center text-center gap-4 pt-6 text-slate-900">
      <p className="text-[14px] font-semibold">Confirm with your card</p>
      <p className="text-[12px] text-slate-600 -mt-2">Exporting your data needs your password and a tap of your SmartGullak card.</p>
      <div className="relative w-24 h-24 flex items-center justify-center">
        {!verified && <span className="pulse-ring absolute inset-0 rounded-full bg-blue-400/40" />}
        <span className="relative w-20 h-20 rounded-full bg-[#0b2545] text-white flex items-center justify-center">
          <CreditCard size={34} />
        </span>
      </div>
      {verified ? (
        <p className="pop-in inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[13px] font-semibold">
          <CircleCheck size={16} /> Verified
        </p>
      ) : (
        <p className="text-[12px] text-slate-500">Hold your card to the reader…</p>
      )}
    </div>
  );
}
