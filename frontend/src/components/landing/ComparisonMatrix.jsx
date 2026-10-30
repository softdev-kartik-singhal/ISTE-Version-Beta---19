// Landing comparison: typical budgeting app vs SmartGullak across five tenets.
import { CircleCheck, CircleX } from 'lucide-react';

const ROWS = [
  {
    tenet: 'Answering "Can I afford this?"',
    typical: 'Retrospective pie chart showing where money already went.',
    ours: 'Deterministic forward waterfall based on liquidity cycles.',
  },
  {
    tenet: 'Handling Freelance / Inconsistent Pay',
    typical: 'Assumes rigid fixed salaries; flags dips as budget failures.',
    ours: 'Stochastic P10/P50/P90 modeling tailored for mixed income.',
  },
  {
    tenet: 'Data Storage & Credential Sharing',
    typical: 'Demands SMS scraper access and persistent netbanking tokens.',
    ours: '100% credential-free. Offline statement parsing and immediate shred.',
  },
  {
    tenet: 'Revenue Model',
    typical: 'Upselling high-interest personal loans and credit cards.',
    ours: 'Clean annual software licensing. Absolute zero data monetization.',
  },
  {
    tenet: 'Authorization Security',
    typical: 'Weak SMS OTPs or basic 4-digit mobile PIN.',
    ours: 'Dual-factor hardware NFC Smart Card tap + passphrase.',
  },
];

export default function ComparisonMatrix() {
  return (
    <section id="comparison" className="px-6 lg:px-12 py-space-2xl bg-surface scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-space-xl">
          <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">The SmartGullak Difference</span>
          <h2 className="font-headline-lg text-headline-lg lg:text-display-lg font-bold text-on-surface mt-1">Why traditional budget apps fail variable earners</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Most personal finance utilities are ad-funded pipelines built to sell credit lines. We built a mathematical decision terminal.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-surface-container-high">
            <div className="md:col-span-4 p-6 lg:p-8 bg-surface-container-low space-y-6">
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface">Fundamental Tenet</div>
              <ul className="space-y-8 font-body-md text-body-md text-on-surface-variant">
                {ROWS.map((r) => (
                  <li key={r.tenet} className="h-10 flex items-center font-medium">
                    {r.tenet}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-4 p-6 lg:p-8 space-y-6 bg-surface-container-lowest">
              <div className="font-headline-sm text-headline-sm font-semibold text-secondary flex items-center gap-space-sm">
                <CircleX size={24} className="text-outline" /> Typical Budgeting App
              </div>
              <ul className="space-y-8 font-body-sm text-body-sm text-on-surface-variant">
                {ROWS.map((r) => (
                  <li key={r.tenet} className="h-10 flex items-center">
                    {r.typical}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-4 p-6 lg:p-8 space-y-6 bg-surface-container">
              <div className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-space-sm">
                <CircleCheck size={24} className="text-primary" /> SmartGullak Engine
              </div>
              <ul className="space-y-8 font-body-sm text-body-sm text-on-surface font-medium">
                {ROWS.map((r) => (
                  <li key={r.tenet} className="h-10 flex items-center">
                    {r.ours}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
