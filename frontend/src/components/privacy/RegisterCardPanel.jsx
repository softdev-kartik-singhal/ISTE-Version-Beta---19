// First card for an account that has none: just tap to register. No password + old-card check (there is no old card);
// that two-step check is only for replacing a card, in SensitiveActionPanel.
import { useEffect, useRef, useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import CardReaderGraphic from '../signup/CardReaderGraphic';
import CardStateFeedback from '../signup/CardStateFeedback';
import { registerCard } from '../../services/cardReader';

const ERROR_STATES = { ALREADY_LINKED: 'error', READER_MISSING: 'warning' };

export default function RegisterCardPanel({ onCancel, onDone }) {
  const [state, setState] = useState('waiting');
  const [card, setCard] = useState(null);
  const attempt = useRef(0);

  // Opens a register request and waits for the tap; only the latest attempt's result is applied.
  function scan() {
    const id = ++attempt.current;
    setState('waiting');
    setCard(null);
    registerCard()
      .then((result) => {
        if (id !== attempt.current) return;
        setCard(result);
        setState('success');
      })
      .catch((err) => id === attempt.current && setState(ERROR_STATES[err.code] || 'warning'));
  }

  useEffect(() => {
    scan();
    return () => {
      attempt.current += 1; // ignore results that arrive after the dialog closes
    };
  }, []);

  return (
    <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden">
      <div className="px-space-lg py-space-md flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container text-primary">
            <CreditCard size={18} />
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Register your SmartGullak card</h3>
        </div>
        <button className="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>
      <div className="p-space-lg space-y-space-lg">
        <div className="w-full bg-surface-container rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <CardReaderGraphic state={state} last4={card?.last4 || '····'} />
          <div className="w-full mt-4 bg-surface-container-lowest p-3.5 rounded-lg flex items-center justify-between">
            <CardStateFeedback state={state} last4={card?.last4} onRetry={scan} />
          </div>
        </div>
        <div className="flex justify-end gap-space-sm">
          <button className="px-space-md py-2 rounded-lg bg-surface-container-low text-secondary font-label-md text-label-md hover:text-on-surface transition-colors" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="px-space-lg py-2 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed text-on-primary font-label-md text-label-md transition-colors shadow-sm"
            type="button"
            disabled={state !== 'success'}
            onClick={() => onDone(card)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
