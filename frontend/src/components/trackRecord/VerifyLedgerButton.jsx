// "Verify Log Integrity" button: asks the server to re-check the whole hash chain.
import { useState } from 'react';
import { BadgeCheck, LockKeyholeOpen, RefreshCw, ShieldX } from 'lucide-react';
import { invalidate, verifyLedger } from '../../services/api';

const BUTTON = 'inline-flex items-center gap-2 h-10 px-space-md rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md transition-colors shadow-sm disabled:opacity-80';

export default function VerifyLedgerButton({ entries }) {
  const [state, setState] = useState('idle'); // idle | verifying | valid | broken

  async function verify() {
    setState('verifying');
    try {
      const result = await verifyLedger();
      setState(result.valid ? 'valid' : 'broken');
      invalidate();
    } catch {
      setState('idle');
    }
    setTimeout(() => setState('idle'), 3000);
  }

  return (
    <button className={BUTTON} onClick={verify} disabled={state !== 'idle'}>
      {state === 'idle' && (
        <>
          <LockKeyholeOpen size={18} />
          <span>Verify Log Integrity</span>
        </>
      )}
      {state === 'verifying' && (
        <>
          <RefreshCw size={18} className="animate-spin" />
          <span>Checking the hash chain...</span>
        </>
      )}
      {state === 'valid' && (
        <>
          <BadgeCheck size={18} />
          <span>Valid ({entries} entries)</span>
        </>
      )}
      {state === 'broken' && (
        <>
          <ShieldX size={18} />
          <span>Altered: see below</span>
        </>
      )}
    </button>
  );
}
