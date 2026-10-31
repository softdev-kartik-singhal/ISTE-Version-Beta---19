// The ten spotlight steps of the first-time tour. Each step points at an element by its data-tour="..." name.
//   route:  page the step lives on (the tour navigates there itself); left out = stay where we are
//   wait:   'click' = the user does the action on the target (the Next button performs it for them)
//   before: something the tour does on the page before the tooltip appears
//   effect: a small animation played once the tooltip is up (see effects.js)
export const QUESTION = 'Can I afford ₹20,000 next month?';

export const STEPS = [
  { id: 'nav-statements', target: 'nav-statements', route: '/dashboard', side: 'right', wait: 'click', text: 'Start here — open Statements.' },
  { id: 'upload', target: 'upload-area', route: '/statements', side: 'top', text: 'Drop CSV or PDF statements here — we merge them and remove duplicates.' },
  { id: 'demo', target: 'demo-btn', route: '/statements', side: 'bottom', wait: 'click', after: 'demoLoaded', text: 'No statements handy? Click to try demo data.' },
  { id: 'money-left', target: 'money-left', route: '/dashboard', side: 'bottom', effect: 'countUp', text: 'This is what you have left after bills this month.' },
  { id: 'ask', target: 'ask-submit', route: '/ask', side: 'bottom', wait: 'click', before: 'typeQuestion', text: 'Press the blue button to see the answer.' },
  { id: 'confirm', target: 'ask-confirm', route: '/ask', side: 'top', wait: 'click', text: 'Check the amount and month, then confirm.' },
  { id: 'how', target: 'how-calc', route: '/ask', side: 'top', effect: 'stagger', text: 'Every step of the calculation is shown here.' },
  { id: 'spending', target: 'spending-cards', route: '/trends', side: 'top', effect: 'stagger', text: 'See where your money went.' },
  { id: 'plan', target: 'plan-goals', route: '/goals', side: 'bottom', effect: 'fill', text: "Set goals and see what to do with what's left." },
  { id: 'more', target: 'nav-more', side: 'right', text: 'Statements, things to check, and privacy settings live here.' },
];
