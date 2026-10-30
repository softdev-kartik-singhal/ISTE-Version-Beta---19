// Illustration of the NFC card hovering over the USB reader; colours and position follow the reader state.
import { CircleAlert, CircleCheck, Nfc, Radio, Unplug, Wifi } from 'lucide-react';

const STATES = {
  waiting: { glow: 'from-primary/10', light: 'bg-primary-container animate-pulse', card: '-translate-y-4 animate-bounce', badge: 'bg-primary-container/10 text-primary', icon: Radio },
  success: { glow: 'from-emerald-500/15', light: 'bg-emerald-500', card: '-translate-y-2', badge: 'bg-emerald-100 text-emerald-700', icon: CircleCheck },
  error: { glow: 'from-error/15', light: 'bg-error', card: '-translate-y-4', badge: 'bg-error-container text-on-error-container', icon: CircleAlert },
  warning: { glow: 'from-amber-500/15', light: 'bg-amber-500', card: '-translate-y-8 opacity-60', badge: 'bg-amber-100 text-amber-800', icon: Unplug },
};

export default function CardReaderGraphic({ state, last4 }) {
  const s = STATES[state];
  const BadgeIcon = s.icon;
  return (
    <>
      <div className={`absolute inset-0 bg-gradient-to-b ${s.glow} via-transparent to-transparent pointer-events-none transition-all duration-500`} />
      <div className="relative w-full max-w-[320px] h-48 flex items-center justify-center">
        <div className="absolute bottom-2 w-56 h-12 rounded-xl bg-inverse-surface shadow-lg flex items-center justify-between px-4 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${s.light}`} />
            <span className="font-currency-sm text-currency-sm text-inverse-on-surface opacity-80">SG-READER-USB</span>
          </div>
          <Wifi size={18} className="text-inverse-on-surface opacity-60" />
        </div>
        <div
          className={`absolute w-52 h-32 rounded-xl bg-gradient-to-tr from-on-background via-inverse-surface to-slate-800 text-on-primary p-3.5 shadow-2xl flex flex-col justify-between transform ${s.card} transition-all duration-300`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-primary-container flex items-center justify-center text-[10px]">SG</div>
              <span className="font-label-sm text-label-sm font-semibold tracking-wide text-primary-fixed">SmartGullak</span>
            </div>
            <Nfc size={18} className="text-primary-fixed-dim" />
          </div>
          <div className="flex flex-col gap-0.5 my-auto">
            <div className="w-7 h-5 rounded bg-yellow-500/80 mb-1 flex items-center justify-center">
              <div className="w-4 h-3 border border-yellow-200/60 rounded-[2px]" />
            </div>
            <span className="font-currency-sm text-currency-sm tracking-widest text-slate-300">•••• •••• •••• {last4}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 font-label-sm text-label-sm">
            <span>CLIENT ENCLAVE</span>
            <span className="font-currency-sm">08/32</span>
          </div>
        </div>
        <div className="absolute -top-1 right-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.badge}`}>
            <BadgeIcon size={20} />
          </div>
        </div>
      </div>
    </>
  );
}
