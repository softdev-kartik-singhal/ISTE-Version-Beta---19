// Two-step confirmation for sensitive actions: (1) master password, (2) tap the SmartGullak card.
// Used inside ConfirmSensitiveActionDialog and, as a live preview, in the Privacy page sandbox.
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ArrowRightLeft, Check, CircleAlert, CircleCheck, CreditCard, Download, ExternalLink, Eye, EyeOff, Info, KeyRound, Nfc, Trash2, TriangleAlert, X } from 'lucide-react';
import { verifyCard } from '../../services/cardReader';
import { verifyPassword } from '../../services/api';

const ACTIONS = {
  export: { title: 'Confirm Sensitive Action — Export Data', icon: Download, badge: 'bg-surface-container text-primary' },
  delete: { title: 'Confirm Sensitive Action — Delete All My Data', icon: Trash2, badge: 'bg-error-container text-error' },
  replace: { title: 'Confirm Sensitive Action — Replace Card', icon: ArrowRightLeft, badge: 'bg-surface-container text-primary' },
};
const PULSE = {
  waiting: 'absolute w-28 h-28 rounded-full bg-primary/10 animate-ping opacity-75',
  verified: 'absolute w-28 h-28 rounded-full bg-emerald-500/20',
  error: 'absolute w-28 h-28 rounded-full bg-error/20',
};

// cardOutcome: 'auto' calls the reader; 'waiting' | 'verified' | 'mismatch' pin a state (sandbox preview).
export default function SensitiveActionPanel({ action, cardOutcome = 'auto', startStep = 1, busy, onCancel, onConfirm, onLostCard }) {
  const [step, setStep] = useState(startStep);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [checking, setChecking] = useState(false);
  const [cardState, setCardState] = useState('waiting');
  const [cardError, setCardError] = useState(''); // why the last tap failed, shown on the retry chip
  const [consent, setConsent] = useState(false);
  const attempt = useRef(0);
  const passwordId = useId(); // unique, because the sandbox and the dialog can both be on screen
  const config = ACTIONS[action];
  const ActionIcon = config.icon;

  function tapCard() {
    const id = ++attempt.current;
    setCardState('waiting');
    verifyCard()
      .then(() => id === attempt.current && setCardState('verified'))
      .catch((err) => {
        if (id !== attempt.current) return;
        setCardError(err.message);
        setCardState('error');
      });
  }

  // Entering step 2 starts the reader (or applies the pinned sandbox state).
  useEffect(() => {
    if (step !== 2) return;
    if (cardOutcome === 'auto') tapCard();
    else setCardState({ waiting: 'waiting', verified: 'verified', mismatch: 'error' }[cardOutcome]);
    return () => {
      attempt.current += 1;
    };
  }, [step, cardOutcome]);

  async function continueToCard() {
    setChecking(true);
    try {
      await verifyPassword(password);
      setPasswordError('');
      setStep(2);
    } catch (err) {
      setPasswordError(err.message);
    }
    setChecking(false);
  }

  const canConfirm = cardState === 'verified' && (action !== 'delete' || consent) && !busy;

  return (
    <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden">
      <div className="px-space-lg py-space-md flex items-center justify-between bg-surface-container-lowest">
        <div className="flex items-center gap-space-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.badge}`}>
            <ActionIcon size={18} />
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{config.title}</h3>
        </div>
        <button className="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>

      <div className="px-space-lg py-space-sm bg-surface-container-lowest flex items-center justify-between">
        <div className="flex items-center gap-space-sm flex-1">
          <div
            className={`w-6 h-6 rounded-full ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-primary text-on-primary'} font-label-sm text-label-sm flex items-center justify-center font-bold`}
          >
            {step === 2 ? <Check size={14} /> : 1}
          </div>
          <span className={`font-label-md text-label-md ${step === 1 ? 'text-on-surface font-semibold' : 'text-secondary'}`}>Password Verification</span>
        </div>
        <div className="w-12 h-0.5 bg-surface-container mx-space-sm" />
        <div className="flex items-center gap-space-sm flex-1 justify-end">
          <div
            className={`w-6 h-6 rounded-full ${step === 2 ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'} font-label-sm text-label-sm flex items-center justify-center font-bold`}
          >
            2
          </div>
          <span className={`font-label-md text-label-md ${step === 2 ? 'text-on-surface font-semibold' : 'text-secondary'}`}>Hardware Card Auth</span>
        </div>
      </div>

      <div className="p-space-lg space-y-space-lg">
        {step === 1 ? (
          <form
            className="space-y-space-md"
            onSubmit={(e) => {
              e.preventDefault();
              continueToCard();
            }}
          >
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor={passwordId}>
                Enter your account password
              </label>
              <div className="relative flex items-center">
                <KeyRound size={20} className="absolute left-3 text-secondary" />
                <input
                  id={passwordId}
                  className="h-10 pl-10 pr-10 w-full rounded-lg bg-surface-container-low font-currency-sm text-currency-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest transition-all"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button className="absolute right-3 text-secondary hover:text-on-surface" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && (
                <p className="flex items-center gap-1 font-label-sm text-label-sm text-error">
                  <CircleAlert size={14} /> {passwordError}
                </p>
              )}
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-2">
              <Info size={16} className="text-secondary mt-0.5" />
              <p className="font-label-sm text-label-sm text-secondary">
                Password checks are calculated via Argon2id locally to decrypt your client-side authentication ticket.
              </p>
            </div>
            <div className="flex justify-end gap-space-sm pt-space-xs">
              <button className="px-space-md py-2 rounded-lg bg-surface-container-low text-secondary font-label-md text-label-md hover:text-on-surface transition-colors" type="button" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="px-space-lg py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                type="submit"
                disabled={checking}
              >
                <span>{checking ? 'Checking...' : 'Continue'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-space-lg">
            <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col items-center justify-center relative overflow-hidden">
              <div className="relative w-48 h-36 flex items-center justify-center">
                <div className="absolute bottom-2 w-32 h-14 rounded-2xl bg-surface-container-highest shadow-inner flex flex-col items-center justify-center">
                  <Nfc size={28} className="text-primary" />
                  <span className="font-label-sm text-label-sm text-secondary">SmartGullak NFC</span>
                </div>
                <div className={PULSE[cardState]} />
                <div className="absolute top-1 transform -rotate-6 w-36 h-24 rounded-xl bg-[#0B2545] p-3 text-white shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm tracking-widest text-white/70">SG-VAULT</span>
                    <CreditCard size={18} className="text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="w-6 h-4 rounded bg-amber-400/80" />
                    <span className="font-currency-sm text-[10px] text-white/90">•••• ····</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md flex flex-col items-center text-center space-y-1">
                <h4 className="font-headline-sm text-headline-sm text-on-surface">Tap your SmartGullak card on the reader</h4>
                <p className="font-body-sm text-body-sm text-secondary">Hold your physical metal security card against your NFC peripheral or phone back.</p>
              </div>
              <div className="mt-space-md">
                {cardState === 'waiting' && (
                  <div className="flex items-center gap-2 px-space-md py-1.5 rounded-full bg-surface-container text-primary font-label-md text-label-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span>Waiting for NFC tap...</span>
                  </div>
                )}
                {cardState === 'verified' && (
                  <div className="flex items-center gap-2 px-space-md py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-label-md text-label-md">
                    <CircleCheck size={16} className="text-emerald-700" />
                    <span>Cryptographic handshake verified</span>
                  </div>
                )}
                {cardState === 'error' && (
                  <button
                    type="button"
                    onClick={tapCard}
                    className="flex items-center gap-2 px-space-md py-1.5 rounded-full bg-error-container text-error font-label-md text-label-md hover:opacity-90"
                  >
                    <CircleAlert size={16} />
                    <span>{cardError || 'Tapped card does not match the registered card'} — Retry</span>
                  </button>
                )}
              </div>
            </div>

            {action === 'delete' && (
              <div className="space-y-space-sm">
                <div className="p-space-md rounded-xl bg-error-container/40 space-y-space-xs">
                  <div className="flex items-center gap-2 text-error">
                    <TriangleAlert size={20} />
                    <span className="font-label-md text-label-md">Irreversible Cryptographic Destruction</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    This action cannot be undone. All encrypted local caches and cloud backups will be shredded immediately using 3-pass zeroing.
                  </p>
                </div>
                <label className="flex items-start gap-space-sm p-space-sm rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer select-none">
                  <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span className="font-body-sm text-body-sm text-on-surface">
                    I understand this action is permanent and irrecoverable. I forfeit access to all multi-account historical cashflows.
                  </span>
                </label>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-xs">
              <button
                type="button"
                className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1"
                onClick={() => {
                  attempt.current += 1;
                  setCardState('verified');
                  onLostCard();
                }}
              >
                <span>Lost your card? Verify by email instead</span>
                <ExternalLink size={14} />
              </button>
              <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
                <button
                  className="px-space-md py-2 rounded-lg bg-surface-container-low text-secondary font-label-md text-label-md hover:text-on-surface transition-colors"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                {action === 'delete' ? (
                  <button
                    className="px-space-lg py-2 rounded-lg bg-error hover:bg-error/90 disabled:opacity-40 disabled:cursor-not-allowed text-on-error font-label-md text-label-md transition-colors flex items-center gap-2 shadow-sm"
                    type="button"
                    disabled={!canConfirm}
                    onClick={onConfirm}
                  >
                    <Trash2 size={18} />
                    <span>Delete All My Data</span>
                  </button>
                ) : (
                  <button
                    className="px-space-lg py-2 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed text-on-primary font-label-md text-label-md transition-colors flex items-center gap-2 shadow-sm"
                    type="button"
                    disabled={!canConfirm}
                    onClick={onConfirm}
                  >
                    <ActionIcon size={18} />
                    <span>{action === 'export' ? 'Export My Data' : busy ? 'Tap the new card...' : 'Pair New Card'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
