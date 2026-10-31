// Small DOM helpers for the tour: waiting for elements, the travelling pointer, typing, count-up and the pulse ring.
// Everything that moves checks prefers-reduced-motion first and falls back to doing the thing instantly.

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const bySelector = (name) => `[data-tour="${name}"]`;

// Resolves with the element once it is on screen, or null after the timeout (the caller then skips the step).
export async function waitFor(name, timeout = 8000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const el = document.querySelector(bySelector(name));
    if (el && el.getClientRects().length) return el;
    await sleep(100);
  }
  return null;
}

// ---- the pointer (a small cursor that travels from one target to the next) ----
const POINTER_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" stroke="#0B2545" stroke-width="1.6" stroke-linejoin="round"><path d="M5 3l14 7-6 2-2 6z"/></svg>';
let pointer = null;

function getPointer() {
  if (pointer) return pointer;
  pointer = document.createElement('div');
  pointer.className = 'tour-pointer';
  pointer.innerHTML = POINTER_SVG;
  pointer.style.transform = `translate(${window.innerWidth * 0.6}px, ${window.innerHeight * 0.8}px)`;
  document.body.appendChild(pointer);
  return pointer;
}

// Glides the pointer onto the target, then plays a soft click ripple there.
export async function movePointer(el) {
  if (reducedMotion()) return;
  const rect = el.getBoundingClientRect();
  const x = Math.min(Math.max(rect.left + rect.width / 2, 12), window.innerWidth - 12);
  const y = Math.min(Math.max(rect.top + Math.min(rect.height / 2, 40), 12), window.innerHeight - 12);
  const p = getPointer();
  p.getBoundingClientRect(); // lets the browser register the start position before the transition begins
  p.classList.add('on');
  p.style.transform = `translate(${x}px, ${y}px)`;
  await sleep(600);
  const ripple = document.createElement('span');
  ripple.className = 'tour-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
  await sleep(150);
}

export function hidePointer() {
  pointer?.classList.remove('on');
}

// ---- typing into a React-controlled input (the native setter + an input event is what React listens for) ----
const setValue = (input, value) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

export async function typeInto(input, text, perLetter = 40) {
  if (!input) return;
  input.focus({ preventScroll: true });
  if (reducedMotion()) return setValue(input, text);
  for (let i = 1; i <= text.length; i++) {
    setValue(input, text.slice(0, i));
    await sleep(perLetter);
  }
}

// ---- count-up: the big number runs from 0 to its real value, then the original text is put back ----
export function countUp(el) {
  const number = el.querySelector('[data-count]');
  const match = number?.textContent.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match || reducedMotion()) return () => {};
  const original = number.textContent;
  const [, prefix, digits, suffix] = match;
  const target = Number(digits.replace(/,/g, ''));
  const start = performance.now();
  let frame;
  const tick = (now) => {
    const t = Math.min((now - start) / 900, 1);
    number.textContent = `${prefix}${Math.round(target * (1 - (1 - t) ** 3)).toLocaleString('en-IN')}${suffix}`;
    if (t < 1) frame = requestAnimationFrame(tick);
    else number.textContent = original;
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    number.textContent = original;
  };
}

// Adds a CSS class to the target for as long as the step is showing (stagger / fill / pulse animations live in tour.css).
export function addClass(el, name) {
  el.classList.add(name);
  return () => el.classList.remove(name);
}

// Resolves 'done' when the demo button reports it loaded, or 'failed' if it went back to idle after loading.
export async function demoLoaded(timeout = 30000) {
  const end = Date.now() + timeout;
  let sawLoading = false;
  while (Date.now() < end) {
    const state = document.querySelector(bySelector('demo-btn'))?.dataset.state;
    if (state === 'done') return 'done';
    if (state === 'loading') sawLoading = true;
    else if (sawLoading && state === 'idle') return 'failed';
    await sleep(120);
  }
  return 'failed';
}
