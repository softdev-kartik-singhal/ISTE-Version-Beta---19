// "Hardware Security Card" panel: shows the registered card (or none) with Replace / Register actions.
import { ArrowRightLeft, CreditCard, Hexagon, Info, ShieldOff } from 'lucide-react';

export default function HardwareCardPanel({ card, onReplace, onRegister, onPreviewChange }) {
  const registered = Boolean(card);
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md border border-[#E3E8EF]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-space-md pb-space-sm border-b border-[#E3E8EF]">
        <div className="space-y-space-xs">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
              <Hexagon size={20} />
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Hardware Security Card</h2>
          </div>
          <p className="font-body-md text-body-md text-secondary">Physical cryptographic key bound to your account for zero-knowledge authorization.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg text-secondary">
          <span className="font-label-sm text-label-sm px-2 text-secondary">Preview Mode:</span>
          <button
            type="button"
            onClick={() => onPreviewChange(true)}
            className={
              registered
                ? 'px-2.5 py-1 rounded-md font-label-sm text-label-sm bg-surface-container-lowest text-primary shadow-sm font-semibold transition-all'
                : 'px-2.5 py-1 rounded-md font-label-sm text-label-sm text-secondary hover:text-on-surface transition-all'
            }
          >
            Registered
          </button>
          <button
            type="button"
            onClick={() => onPreviewChange(false)}
            className={
              !registered
                ? 'px-2.5 py-1 rounded-md font-label-sm text-label-sm bg-surface-container-lowest text-primary shadow-sm font-semibold transition-all'
                : 'px-2.5 py-1 rounded-md font-label-sm text-label-sm text-secondary hover:text-on-surface transition-all'
            }
          >
            No card registered
          </button>
        </div>
      </div>
      {registered ? (
        <div className="space-y-space-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low">
            <div className="flex items-center gap-space-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <CreditCard size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-label-sm font-semibold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
                    Registered
                  </span>
                  <span className="font-currency-sm text-currency-sm font-semibold text-on-surface">SmartGullak card •• {card.last4}</span>
                </div>
                <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                  Added {card.added} • Firmware {card.firmware} • Client Enclave bound
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onReplace}
                className="h-10 px-space-md bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-[#E3E8EF] rounded-lg font-label-md text-label-md flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <ArrowRightLeft size={18} />
                <span>Replace card</span>
              </button>
            </div>
          </div>
          <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-2">
            <Info size={16} className="text-secondary mt-0.5 flex-shrink-0" />
            <p className="font-label-sm text-label-sm text-secondary">
              Replacing your card opens the Confirm Sensitive Action dialog first, then guides you through pairing a new card.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md p-space-md rounded-xl bg-error-container/30 border border-error-container">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center flex-shrink-0">
              <ShieldOff size={22} />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm font-semibold">No card registered</span>
              <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                Sensitive actions like data export and deletion require a physical card. Register a card to activate hardware-level sovereign protection.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onRegister}
              className="h-10 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-md text-label-md flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <CreditCard size={18} />
              <span>Register card</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
