// The three full-screen cards of the tour: welcome, success and "skip the tour?".
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { reducedMotion } from './effects';

function Backdrop({ children, label }) {
  return (
    <div className="tour-backdrop" role="dialog" aria-modal="true" aria-label={label}>
      <div className="tour-modal">{children}</div>
    </div>
  );
}

const PRIMARY = 'h-10 px-space-lg rounded-lg bg-primary-container text-white hover:bg-primary font-label-md text-label-md shadow-sm transition-colors';
const QUIET = 'h-10 px-space-md rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors';

// The same vault mark as the auth screens, bouncing in once.
function Logo() {
  return (
    <div className="tour-logo w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-space-md shadow-sm">
      <svg className="w-9 h-9 fill-current text-primary" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 8h-2.18c-.42-2.31-2.43-4-4.82-4-.86 0-1.66.24-2.36.65L9.64 4.65C9.25 4.26 8.62 4.26 8.23 4.65c-.39.39-.39 1.02 0 1.41l.74.74C7.75 7.85 7 9.33 7 11c0 1.02.29 1.97.79 2.78L4.29 17.29a.996.996 0 101.41 1.41l2.87-2.87C9.64 16.52 10.78 17 12 17c2.39 0 4.4-1.69 4.82-4H19c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-7-2c1.65 0 3 1.35 3 3H9c0-1.65 1.35-3 3-3zm0 9c-2.21 0-4-1.79-4-4 0-.58.13-1.12.35-1.62l1.66 1.66c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L9.76 8.97c.64-.61 1.49-.97 2.24-.97 2.21 0 4 1.79 4 4s-1.79 4-4 4z" />
      </svg>
    </div>
  );
}

export function WelcomeModal({ onStart, onSkip }) {
  return (
    <Backdrop label="Welcome tour">
      <Logo />
      <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Welcome to SmartGullak!</h2>
      <p className="font-body-md text-body-md text-secondary mt-1">Let&apos;s take a 1-minute tour.</p>
      <div className="flex items-center justify-center gap-space-sm mt-space-lg">
        <button className={QUIET} onClick={onSkip}>Skip</button>
        <button className={PRIMARY} onClick={onStart} autoFocus>Start tour</button>
      </div>
    </Backdrop>
  );
}

export function SuccessModal({ onUpload, onClose }) {
  // A short, light confetti burst (none when the user prefers reduced motion).
  useEffect(() => {
    if (!reducedMotion()) confetti({ particleCount: 70, spread: 70, startVelocity: 35, ticks: 120, origin: { y: 0.65 }, zIndex: 2000000000 });
  }, []);
  return (
    <Backdrop label="Tour finished">
      <svg className="tour-check mx-auto mb-space-md" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="none" stroke="#1d4ed8" strokeWidth="4" />
        <path d="M19 33l9 9 17-19" fill="none" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">You&apos;re all set!</h2>
      <div className="flex items-center justify-center gap-space-sm mt-space-lg">
        <button className={QUIET} onClick={onClose}>Keep exploring</button>
        <button className={PRIMARY} onClick={onUpload} autoFocus>Upload my statements</button>
      </div>
    </Backdrop>
  );
}

export function ConfirmSkipModal({ onKeep, onSkip }) {
  return (
    <Backdrop label="Skip the tour?">
      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Are you sure?</h2>
      <p className="font-body-md text-body-md text-secondary mt-1">You can replay the tour any time from the sidebar.</p>
      <div className="flex items-center justify-center gap-space-sm mt-space-lg">
        <button className={QUIET} onClick={onSkip}>Skip tour</button>
        <button className={PRIMARY} onClick={onKeep} autoFocus>Keep going</button>
      </div>
    </Backdrop>
  );
}
