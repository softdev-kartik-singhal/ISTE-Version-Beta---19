// First-time product tour. driver.js draws the spotlight and tooltips; this file decides which step comes next,
// moves between pages, waits for the user's clicks and saves progress to the backend (so it resumes on any device).
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';
import { saveTour } from '../services/api';
import { STEPS, QUESTION } from './steps';
import { addClass, bySelector, countUp, demoLoaded, hidePointer, movePointer, reducedMotion, sleep, typeInto, waitFor } from './effects';
import { TourContext } from './tourContext';
import { ConfirmSkipModal, SuccessModal, WelcomeModal } from './TourModals';

const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'SELECT'];

export function TourProvider({ tour, userKey, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [phase, setPhase] = useState('idle'); // idle | welcome | running | done
  const [confirmSkip, setConfirmSkip] = useState(false);
  // Everything the async step logic needs lives in one ref so it never reads stale state.
  const run = useRef({ token: 0, index: 0, driver: null, cleanup: null, pathname, phase: 'idle', previousPercent: 0 });
  run.current.pathname = pathname;
  run.current.phase = phase;

  // ---- ending the tour ----
  function stopEverything() {
    const r = run.current;
    r.token += 1; // cancels any step still waiting for an element or a click
    r.cleanup?.();
    r.cleanup = null;
    r.driver?.destroy();
    r.driver = null;
    hidePointer();
    document.body.classList.remove('tour-active');
  }

  function leave() {
    // Skipped or closed: counts as done so it never comes back by itself (the sidebar can replay it).
    saveTour(true, run.current.index).catch(() => {});
    stopEverything();
    setConfirmSkip(false);
    setPhase('idle');
  }

  async function finish() {
    stopEverything();
    saveTour(true, STEPS.length).catch(() => {});
    setPhase('done');
  }

  // ---- one step ----
  function makeDriver() {
    const next = () => advance();
    return driver({
      animate: !reducedMotion(),
      smoothScroll: true,
      allowClose: false, // clicks outside shake the tooltip instead (see the click handler below)
      overlayOpacity: 0.6,
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'tour-pop',
      showProgress: true,
      progressText: 'Step {{current}} of {{total}}',
      showButtons: ['next'],
      nextBtnText: 'Next',
      doneBtnText: 'Done',
      onNextClick: next,
      onDestroyStarted: () => {}, // Esc / outside clicks never close it; Skip asks "are you sure?" first
      onPopoverRender: (popover, { state }) => decorate(popover, state.activeIndex),
      steps: STEPS.map((s) => ({
        element: bySelector(s.target), // looked up when the step is shown, so the page can render first
        popover: { description: s.text, side: s.side, align: 'center' },
      })),
    });
  }

  // Adds the thin progress bar and the Skip button to a freshly drawn tooltip.
  function decorate(popover, index) {
    const r = run.current;
    const bar = document.createElement('div');
    bar.className = 'tour-progress';
    const fill = document.createElement('span');
    fill.style.width = `${r.previousPercent}%`;
    bar.appendChild(fill);
    popover.wrapper.prepend(bar);
    const percent = ((index + 1) / STEPS.length) * 100;
    requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = `${percent}%`)));
    r.previousPercent = percent;

    const skip = document.createElement('button');
    skip.className = 'tour-skip';
    skip.textContent = 'Skip tour';
    skip.onclick = () => setConfirmSkip(true);
    popover.footerButtons.prepend(skip);
    setTimeout(() => popover.nextButton.focus({ preventScroll: true }), 50); // so Enter means Next, not Skip
  }

  // Shows step i: go to its page, wait for the target, move the pointer there, then show the tooltip.
  async function goTo(i) {
    const r = run.current;
    const token = ++r.token;
    r.cleanup?.();
    r.cleanup = null;
    if (i >= STEPS.length) return finish();
    const step = STEPS[i];
    r.index = i;
    saveTour(false, i).catch(() => {});

    if (step.route && r.pathname !== step.route) {
      r.driver?.destroy(); // a new page gets a fresh spotlight, with a quick fade
      r.driver = null;
      navigate(step.route);
    }
    const el = await waitFor(step.target);
    if (token !== r.token) return;
    if (!el) return goTo(i + 1); // the element is not there: skip this step rather than break the tour
    el.scrollIntoView({ block: 'center' });
    if (step.before === 'typeQuestion') await typeInto(document.querySelector(bySelector('ask-input')), QUESTION);
    if (token !== r.token) return;
    await movePointer(el);
    if (token !== r.token) return;

    if (!r.driver) r.driver = makeDriver();
    if (r.driver.isActive()) r.driver.moveTo(i);
    else r.driver.drive(i);
    r.cleanup = playStep(step, el, i);
  }

  // Pulse, effects and the wait-for-click listener of the step that is now showing. Returns the undo function.
  function playStep(step, el, i) {
    const undo = [];
    if (step.wait) undo.push(addClass(el, 'tour-pulse'));
    if (step.effect === 'countUp') undo.push(countUp(el));
    if (step.effect === 'stagger') undo.push(addClass(el, 'tour-stagger'));
    if (step.effect === 'fill') undo.push(addClass(el, 'tour-filling'));
    if (step.wait === 'click') {
      const onClick = () => afterClick(step, i);
      el.addEventListener('click', onClick, { once: true });
      undo.push(() => el.removeEventListener('click', onClick));
    }
    return () => undo.forEach((fn) => fn());
  }

  async function afterClick(step, i) {
    const r = run.current;
    const token = r.token;
    if (step.after === 'demoLoaded') {
      r.driver?.destroy(); // let the real loading state show without a dimmed page
      r.driver = null;
      hidePointer();
      if ((await demoLoaded()) !== 'done') return token === r.token && goTo(i); // it failed: show this step again
    } else {
      await sleep(60); // let the page react to the click first
    }
    if (token === r.token) goTo(i + 1);
  }

  // The Next button: on a "do it yourself" step it performs the action for the user.
  function advance() {
    const r = run.current;
    const step = STEPS[r.index];
    const el = document.querySelector(bySelector(step.target));
    if (step.wait === 'click' && el) el.click();
    else goTo(r.index + 1);
  }

  // ---- starting, resuming, replaying ----
  function begin(i) {
    document.body.classList.add('tour-active');
    setPhase('running');
    goTo(i);
  }

  const started = useRef(false);
  useEffect(() => {
    if (started.current || tour.completed) return;
    started.current = true;
    if (tour.step > 0) begin(Math.min(tour.step, STEPS.length - 1)); // left midway: resume where they stopped
    else setPhase('welcome');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function replay() {
    stopEverything();
    await saveTour(false, 0).catch(() => {});
    navigate('/dashboard');
    setPhase('welcome');
  }

  // ---- keyboard and outside clicks ----
  useEffect(() => {
    function onKey(e) {
      if (run.current.phase !== 'running') return;
      if (e.key === 'Escape') setConfirmSkip(true);
      if (e.key === 'Enter' && !confirmSkip && !TYPING_TAGS.includes(e.target.tagName)) advance();
    }
    function onClick(e) {
      if (run.current.phase !== 'running' || !e.target.closest?.('.driver-overlay')) return;
      const pop = document.querySelector('.driver-popover');
      pop?.classList.remove('tour-shake');
      pop?.getBoundingClientRect(); // restart the animation if it is already shaking
      pop?.classList.add('tour-shake');
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmSkip]);

  // Leaving the app shell (sign out) ends the tour quietly. The timeout lets React's dev double-mount pass without cancelling it.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      setTimeout(() => !mounted.current && stopEverything());
    };
  }, []);

  return (
    <TourContext.Provider value={{ running: phase === 'running', replay, userKey }}>
      {children}
      {phase === 'welcome' && <WelcomeModal onStart={() => begin(0)} onSkip={leave} />}
      {phase === 'done' && (
        <SuccessModal
          onUpload={() => { setPhase('idle'); navigate('/statements'); }}
          onClose={() => setPhase('idle')}
        />
      )}
      {confirmSkip && <ConfirmSkipModal onKeep={() => setConfirmSkip(false)} onSkip={leave} />}
    </TourContext.Provider>
  );
}
