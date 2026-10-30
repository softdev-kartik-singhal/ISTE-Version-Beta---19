// Message box under the card graphic: scanning, verified, already-linked or reader-missing, with its action.
import { BadgeCheck, CircleAlert, TriangleAlert } from 'lucide-react';

export default function CardStateFeedback({ state, last4, onRetry }) {
  if (state === 'waiting') {
    return (
      <>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-primary-container animate-ping" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Tap card on reader</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Hold SmartGullak hardware key against sensor</span>
          </div>
        </div>
        <span className="font-currency-sm text-currency-sm text-primary font-semibold">Scanning...</span>
      </>
    );
  }
  if (state === 'success') {
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BadgeCheck size={18} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Card ending •• {last4}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-label-sm text-label-sm font-semibold">Verified</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Hardware key securely bound to private enclave</span>
          </div>
        </div>
        <button type="button" onClick={onRetry} className="text-xs text-on-surface-variant hover:text-on-surface underline">
          Unpair
        </button>
      </>
    );
  }
  if (state === 'error') {
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
            <CircleAlert size={18} />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Card already linked</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">This NFC UID is registered to another primary account</span>
          </div>
        </div>
        <button type="button" onClick={onRetry} className="h-8 px-3 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant">
          Try Another Card
        </button>
      </>
    );
  }
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
          <TriangleAlert size={18} />
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Reader not found</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Connect reader via USB port or pair via BLE</span>
        </div>
      </div>
      <button type="button" onClick={onRetry} className="h-8 px-3 rounded bg-amber-600 text-on-primary font-label-sm text-label-sm font-semibold hover:opacity-90">
        Retry Connection
      </button>
    </>
  );
}
