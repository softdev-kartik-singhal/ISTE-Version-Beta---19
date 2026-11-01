// Surplus Plan footer: the stewardship line, what the numbers are based on, and policy links.
import { Link } from 'react-router-dom';
import { LockKeyhole, Wallet } from 'lucide-react';

export default function StewardshipFooter({ onMethodology }) {
  return (
    <footer className="mt-6 flex flex-col gap-5 border-t border-slate-300 pt-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200"><Wallet size={20} aria-hidden="true" /></span>
          <span>
            <span className="block text-[15px] font-bold text-slate-900">SmartGullak Financial Stewardship Standards</span>
            <span className="block text-[14px] text-slate-600">For personal investment advice, consult a SEBI-registered investment adviser (RIA).</span>
          </span>
        </div>
        <p className="flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] text-slate-700 ring-1 ring-slate-200"><LockKeyhole size={14} className="text-[#1d4ed8]" aria-hidden="true" /> Deterministic Local Calculations</p>
      </div>
      <div className="flex flex-col justify-between gap-2 text-[13px] text-slate-600 sm:flex-row sm:items-center">
        <span>© 2026 SmartGullak. All numbers are calculated from the statements you uploaded.</span>
        <div className="flex items-center gap-4">
          <Link className="hover:text-[#1d4ed8]" to="/privacy">Privacy Policy</Link>
          <button type="button" className="hover:text-[#1d4ed8]" onClick={onMethodology}>Methodology</button>
        </div>
      </div>
    </footer>
  );
}
