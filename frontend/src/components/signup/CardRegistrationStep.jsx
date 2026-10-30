// Sign Up step 2: register the NFC card via cardReader.registerCard(), with the design's hardware-event sandbox.
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, LockOpen, Nfc } from 'lucide-react';
import CardReaderGraphic from './CardReaderGraphic';
import CardStateFeedback from './CardStateFeedback';
import { registerCard } from '../../services/cardReader';

// Sandbox buttons force a reader outcome so every state can be demoed without hardware.
const SANDBOX = [
  { state: 'waiting', label: '1. Waiting', simulate: 'success' },
  { state: 'success', label: '2. Registered', simulate: 'success' },
  { state: 'error', label: '3. Linked Error', simulate: 'ALREADY_LINKED' },
  { state: 'warning', label: '4. Reader Missing', simulate: 'READER_MISSING' },
];
const ERROR_STATES = { ALREADY_LINKED: 'error', READER_MISSING: 'warning' };

export default function CardRegistrationStep({ onFinish, onBack, onSkip }) {
  const [state, setState] = useState('waiting');
  const [card, setCard] = useState(null);
  const attempt = useRef(0);

  // Starts a scan; only the latest scan's result is applied.
  function scan(simulate = 'success') {
    const id = ++attempt.current;
    setState('waiting');
    setCard(null);
    registerCard({ simulate })
      .then((result) => {
        if (id !== attempt.current) return;
        setCard(result);
        setState('success');
      })
      .catch((err) => {
        if (id === attempt.current) setState(ERROR_STATES[err.code] || 'error');
      });
  }

  // Start scanning as soon as the step opens.
  useEffect(() => {
    scan();
    return () => {
      attempt.current += 1; // ignore results that arrive after leaving this step
    };
  }, []);

  function sandbox(option) {
    if (option.state === 'success') {
      attempt.current += 1;
      setCard({ last4: '4F2A' });
      setState('success');
    } else if (option.state === 'waiting') scan();
    else scan(option.simulate);
  }

  const finishEnabled = state === 'success';

  return (
    <div className="w-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Register your physical card</h1>
          <span className="bg-surface-container text-primary font-label-sm text-label-sm px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
            <Nfc size={12} /> NFC Hardware
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
          Your physical card protects high-impact actions like exporting ledgers, unlinking banks, or purging data. Zero overhead for daily tracking.
        </p>
      </div>
      <div className="bg-surface-container-low p-2.5 rounded-lg mb-5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Simulate Hardware Event</span>
          <span className="font-currency-sm text-currency-sm text-primary">NFC Device Bus</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {SANDBOX.map((option) => (
            <button
              key={option.state}
              type="button"
              onClick={() => sandbox(option)}
              className={
                option.state === state
                  ? 'py-1 px-2 rounded font-label-sm text-label-sm font-semibold bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'py-1 px-2 rounded font-label-sm text-label-sm font-medium text-on-surface-variant hover:text-on-surface'
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full bg-surface-container rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <CardReaderGraphic state={state} last4={card?.last4 || '4F2A'} />
        <div className="w-full mt-4 bg-surface-container-lowest p-3.5 rounded-lg flex items-center justify-between transition-all duration-300">
          <CardStateFeedback state={state} last4={card?.last4} onRetry={() => scan()} />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <button
          className={
            finishEnabled
              ? 'w-full h-11 rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] cursor-pointer transition-all'
              : 'w-full h-11 rounded-lg bg-surface-variant text-on-surface-variant cursor-not-allowed font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-2 transition-all'
          }
          disabled={!finishEnabled}
          onClick={() => onFinish(card)}
        >
          <span>Finish setup &amp; Open Vault</span>
          <LockOpen size={18} />
        </button>
        <div className="flex items-center justify-between px-1">
          <button className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface flex items-center gap-1" type="button" onClick={onBack}>
            <ArrowLeft size={16} /> Back to credentials
          </button>
          <button className="font-body-sm text-body-sm text-primary font-semibold hover:underline" type="button" onClick={onSkip}>
            Skip for now
          </button>
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant text-center mt-0.5">
          Note: You will be required to register a security card before exporting ledgers or deleting sensitive vault data.
        </p>
      </div>
    </div>
  );
}
