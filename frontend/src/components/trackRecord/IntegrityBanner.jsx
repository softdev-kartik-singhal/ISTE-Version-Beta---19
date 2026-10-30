// Ledger integrity banner with the "Simulate Tamper Attack" demo and its alert/restore state.
import { useState } from 'react';
import { BadgeCheck, Bug, ShieldX } from 'lucide-react';

export default function IntegrityBanner({ integrity }) {
  const [tampered, setTampered] = useState(false);
  return (
    <div className="space-y-3">
      <div className={`p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md ${tampered ? 'opacity-40' : ''}`}>
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <BadgeCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-on-surface">All {integrity.entries} entries verified — nothing has been altered</span>
              <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-medium">Merkle Root Valid</span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary">
              SHA-256 state tree matches local browser storage and bank statement hash anchors at Block #{integrity.block}.
            </p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary text-label-md font-label-md transition-colors shrink-0"
          onClick={() => setTampered(true)}
        >
          <Bug size={16} />
          <span>Simulate Tamper Attack</span>
        </button>
      </div>
      {tampered && (
        <div className="p-space-md rounded-xl bg-error-container text-on-error-container shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md animate-pulse">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center shrink-0">
              <ShieldX size={24} />
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm font-bold text-error">Tamper Detection Safeguard Triggered!</h4>
              <p className="font-body-sm text-body-sm text-on-error-container">
                Signature mismatch on block #3 (hash corrupted). If any past row, transaction weight, or recommendation is modified, the signature
                chain breaks immediately.
              </p>
            </div>
          </div>
          <button
            className="px-space-md py-1.5 rounded-lg bg-error text-on-error font-label-md text-label-md hover:bg-on-error-container transition-colors shrink-0"
            onClick={() => setTampered(false)}
          >
            Restore Clean State
          </button>
        </div>
      )}
    </div>
  );
}
