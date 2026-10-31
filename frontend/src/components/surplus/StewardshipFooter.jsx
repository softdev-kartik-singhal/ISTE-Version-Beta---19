// Surplus Plan footer: stewardship standards, compliance chips and policy links.
import { Link } from 'react-router-dom';
import { BadgeCheck, LockKeyhole, Shield, Wallet } from 'lucide-react';

export default function StewardshipFooter({ onMethodology }) {
  return (
    <footer className="mt-space-md p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant">
            <Wallet size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface font-bold">SmartGullak Financial Stewardship Standards</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              For personal investment advice, consult a SEBI-registered investment adviser (RIA).
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low">
            <Shield size={14} className="text-primary" />
            <span>RBI Data Localization Compliant</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low">
            <BadgeCheck size={14} className="text-primary" />
            <span>Zero Product Placement</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low">
            <LockKeyhole size={14} className="text-primary" />
            <span>Plain arithmetic on your statements</span>
          </div>
        </div>
      </div>
      <div className="pt-space-md bg-surface-container-low/50 -mx-space-lg -mb-space-lg px-space-lg py-3 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-on-surface-variant font-label-sm text-label-sm">
        <span>© 2025 SmartGullak Inc. All numbers computed against connected accounts.</span>
        <div className="flex items-center gap-4">
          <Link className="hover:text-primary transition-colors" to="/privacy">Privacy Policy</Link>
          <Link className="hover:text-primary transition-colors" to="/track-record">Audit Disclosures</Link>
          <button className="hover:text-primary transition-colors" onClick={onMethodology}>
            Methodology
          </button>
        </div>
      </div>
    </footer>
  );
}
