// "Verify Log Integrity" button that animates verifying -> valid -> back to idle.
import { useState } from 'react';
import { BadgeCheck, LockKeyholeOpen, RefreshCw } from 'lucide-react';

export default function VerifyLedgerButton({ blockCount }) {
  const [state, setState] = useState('idle');

  function verify() {
    setState('verifying');
    setTimeout(() => {
      setState('valid');
      setTimeout(() => setState('idle'), 3000);
    }, 1200);
  }

  return (
    <button
      className="inline-flex items-center gap-2 h-10 px-space-md rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md transition-colors shadow-sm"
      onClick={verify}
      disabled={state !== 'idle'}
    >
      {state === 'idle' && (
        <>
          <LockKeyholeOpen size={18} />
          <span>Verify Log Integrity</span>
        </>
      )}
      {state === 'verifying' && (
        <>
          <RefreshCw size={18} className="animate-spin" />
          <span>Verifying Merkle Tree...</span>
        </>
      )}
      {state === 'valid' && (
        <>
          <BadgeCheck size={18} />
          <span>100% Valid ({blockCount} Blocks)</span>
        </>
      )}
    </button>
  );
}
