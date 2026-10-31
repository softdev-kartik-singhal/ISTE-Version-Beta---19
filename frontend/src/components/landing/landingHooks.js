// Small hooks shared by the landing page: reduced-motion check, "is this in view", and a count-up number.
import { useEffect, useRef, useState } from 'react';

export function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Returns [ref, visible]; visible turns true once the element enters the viewport and stays true.
export function useInView(options = { threshold: 0.2 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        io.disconnect();
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  return [ref, visible];
}

// Counts from 0 to `target` over `ms` once `start` is true (instantly with reduced motion).
export function useCountUp(target, start, ms = 900) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return undefined;
    if (reduced) {
      setValue(target);
      return undefined;
    }
    let frame;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      setValue(Math.round(target * (1 - (1 - p) ** 3))); // ease-out
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, ms, reduced]);
  return value;
}

// ₹ with Indian grouping, whole rupees: 1480000 -> "₹14,80,000".
export const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Right padding for sections that share the screen with the docked phone (desktop only), so text never sits under it.
export const PHONE_SPACE = 'lg:pr-[344px] xl:pr-[460px]';
