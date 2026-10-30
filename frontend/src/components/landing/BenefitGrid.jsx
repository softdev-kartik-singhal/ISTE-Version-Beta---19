// Landing "System Architecture" section: three core benefit cards.
import { Calculator, FileCheck, Landmark, Nfc, Save, ScanSearch } from 'lucide-react';

const BENEFITS = [
  {
    icon: Landmark,
    title: 'All accounts in one place',
    text: 'Drop your HDFC, ICICI, or Kotak PDFs and CSVs. We auto-normalize UPI spends, freelance retainers, and hidden subscriptions into one unified, de-duplicated ledger.',
    footIcon: FileCheck,
    foot: 'Supports 32+ Indian Bank formats',
  },
  {
    icon: ScanSearch,
    title: 'Every answer explained',
    text: 'We never give a flat yes or no without mathematical proof. View step-by-step cashflow waterfalls across worst-case, median, and bonus scenarios before committing money.',
    footIcon: Calculator,
    foot: 'Deterministic mathematical models',
  },
  {
    icon: Nfc,
    title: 'Your data protected by card + password',
    text: 'Hardware-grade security. Sensitive operations like exporting or purging history require physical SmartGullak NFC card verification. Raw statements are permanently destroyed after parsing.',
    footIcon: Save,
    foot: 'Zero cloud residual storage',
  },
];

export default function BenefitGrid() {
  return (
    <section id="features" className="px-6 lg:px-12 py-space-2xl bg-surface-container-low scroll-mt-16">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-3xl">
          <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">System Architecture</span>
          <h2 className="font-headline-lg text-headline-lg lg:text-display-lg lg:leading-tight font-bold text-on-surface mt-1">
            Designed for complex earners who refuse vague budgeting advice
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Generic apps classify spends after money is gone. SmartGullak orchestrates multi-stream inflows to give deterministic answers in advance.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BENEFITS.map(({ icon: Icon, footIcon: FootIcon, ...b }) => (
            <div key={b.title} className="rounded-xl bg-surface-container-lowest p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-6">
                  <Icon size={28} />
                </div>
                <h3 className="font-headline-md text-headline-md font-semibold text-on-surface mb-3">{b.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{b.text}</p>
              </div>
              <div className="mt-8 pt-4 flex items-center gap-space-sm text-secondary font-label-md text-label-md">
                <FootIcon size={18} />
                <span>{b.foot}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
