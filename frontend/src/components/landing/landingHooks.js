// Landing page helpers: the shared motion hooks (re-exported from hooks/useMotion), ₹ formatting and the phone's reserved space.
export { useCountUp, useInView, useReducedMotion } from '../../hooks/useMotion';

// ₹ with Indian grouping, whole rupees: 1480000 -> "₹14,80,000".
export const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Right padding for sections that share the screen with the docked phone (desktop only), so text never sits under it.
export const PHONE_SPACE = 'lg:pr-[344px] xl:pr-[460px]';
