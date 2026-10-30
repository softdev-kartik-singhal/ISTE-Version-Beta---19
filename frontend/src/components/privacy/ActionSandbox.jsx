// Live preview of the sensitive-action panel with toggles for action, step and NFC state.
import { useState } from 'react';
import SensitiveActionPanel from './SensitiveActionPanel';

const TOGGLE_IDLE = 'rounded-md font-label-md text-label-md text-secondary hover:text-on-surface transition-all';

export default function ActionSandbox({ onPreviewConfirm, onLostCard }) {
  const [mode, setMode] = useState('export');
  const [step, setStep] = useState(1);
  const [nfc, setNfc] = useState('waiting');

  const nfcActive = { waiting: 'text-primary', verified: 'text-emerald-700', mismatch: 'text-error' };

  return (
    <div className="space-y-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Operational Sandbox &amp; Verification Protocol</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Interactive Sensitive Action Modal</h2>
        </div>
        <p className="font-body-sm text-body-sm text-secondary">Toggle live state variations below to test the hardware authentication flow.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
        <div className="flex items-center gap-space-sm">
          <span className="font-label-md text-label-md text-secondary">Action Mode:</span>
          <div className="inline-flex p-1 bg-surface-container-low rounded-lg">
            <button
              className={`px-space-md py-1.5 ${mode === 'export' ? 'rounded-md font-label-md text-label-md text-on-primary bg-primary shadow-sm transition-all' : TOGGLE_IDLE}`}
              onClick={() => setMode('export')}
            >
              Export Data
            </button>
            <button
              className={`px-space-md py-1.5 ${mode === 'delete' ? 'rounded-md font-label-md text-label-md text-on-error bg-error shadow-sm transition-all' : TOGGLE_IDLE}`}
              onClick={() => setMode('delete')}
            >
              Delete Account
            </button>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <span className="font-label-md text-label-md text-secondary">Active Step:</span>
          <div className="inline-flex p-1 bg-surface-container-low rounded-lg">
            {[1, 2].map((s) => (
              <button
                key={s}
                className={`px-space-sm py-1.5 ${step === s ? 'rounded-md font-label-md text-label-md text-on-primary bg-primary shadow-sm transition-all' : TOGGLE_IDLE}`}
                onClick={() => setStep(s)}
              >
                {s === 1 ? '1: Password' : '2: SmartGullak Card'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <span className="font-label-md text-label-md text-secondary">NFC State:</span>
          <div className="inline-flex p-1 bg-surface-container-low rounded-lg">
            {['waiting', 'verified', 'mismatch'].map((s) => (
              <button
                key={s}
                className={`px-2.5 py-1.5 ${nfc === s ? `rounded-md font-label-md text-label-md bg-surface-container-lowest shadow-sm ${nfcActive[s]}` : TOGGLE_IDLE}`}
                onClick={() => {
                  setNfc(s);
                  setStep(2);
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-surface-container-low/60 rounded-2xl p-space-xl flex flex-col items-center justify-center">
        <SensitiveActionPanel
          key={`${mode}-${step}-${nfc}`}
          action={mode}
          startStep={step}
          cardOutcome={nfc}
          onCancel={() => {
            setStep(1);
            setNfc('waiting');
          }}
          onConfirm={() => onPreviewConfirm(mode)}
          onLostCard={onLostCard}
        />
      </div>
    </div>
  );
}
