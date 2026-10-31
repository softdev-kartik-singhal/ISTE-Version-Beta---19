// Landing pricing: Starter and Premium plans, trust line and the licensing contact link.
import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, Shield, Star } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const STARTER_FEATURES = ['Up to 2 bank accounts', 'Real-time dashboard and trends', '"Can I afford it?" answers', 'Local in-memory statement parsing'];
const PREMIUM_FEATURES = [
  'Unlimited bank accounts & credit lines',
  'What-if scenarios & forward cashflow simulations',
  'Goals tracker with feasibility scoring',
  'Money flow analysis (node & link / Sankey view)',
  'Forecast track record & precision audit',
  'Full data export (CSV & JSON)',
  'SmartGullak Hardware Key compatibility',
];

export default function PricingSection({ plans, onContact }) {
  return (
    <section className="px-6 lg:px-12 py-space-2xl bg-surface-container-low scroll-mt-16" id="pricing">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">TRANSPARENT, UNCOMPROMISED PRICING</span>
          <h2 className="font-headline-lg text-headline-lg lg:text-display-lg font-bold text-on-surface mt-1">Simple, honest pricing for complete financial clarity</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            No hidden charges, zero loan ads, no data monetization. Just deterministic math to answer what you can afford.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-high/60">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-surface-container text-secondary font-label-md text-label-md font-semibold">Starter / Basic</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Zero Commitment</span>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-currency-hero text-currency-hero font-bold text-on-surface">{formatCurrency(plans.starter.price)}</span>
                  <span className="font-body-md text-body-md text-on-surface-variant font-medium">/ forever</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  Essential liquidity tracking and deterministic affordability answers for individuals.
                </p>
              </div>
              <div className="h-px w-full bg-surface-container-high" />
              <ul className="space-y-3 font-body-sm text-body-sm text-on-surface">
                {STARTER_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-space-sm">
                    <CircleCheck size={20} className="text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-6 border-t border-surface-container-high/60">
              <Link
                className="w-full py-3 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-headline-sm text-headline-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-space-sm"
                to="/signup"
              >
                <span>Get Started Free</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-8 shadow-md flex flex-col justify-between hover:shadow-xl transition-shadow border-2 border-primary relative">
            <div className="absolute -top-3.5 right-6">
              <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold tracking-wide uppercase shadow-sm flex items-center gap-1">
                <Star size={14} /> Most Popular
              </span>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md font-semibold">Premium</span>
                <span className="font-label-sm text-label-sm text-primary font-medium">14-day free trial</span>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-currency-hero text-currency-hero font-bold text-primary">{formatCurrency(plans.premium.price)}</span>
                  <span className="font-body-md text-body-md text-on-surface-variant font-medium">/ per month</span>
                </div>
                <p className="font-label-sm text-label-sm text-secondary mt-0.5">
                  or billed annually at {formatCurrency(plans.premium.annual)}/yr (save {plans.premium.saving})
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  Complete multi-stream financial sovereignty with scenario simulations, flow mapping, and unlimited accounts.
                </p>
              </div>
              <div className="h-px w-full bg-surface-container-high" />
              <ul className="space-y-3 font-body-sm text-body-sm text-on-surface">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-space-sm">
                    <CircleCheck size={20} className="text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-6 border-t border-surface-container-high/60">
              <Link
                className="w-full py-3 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold transition-all shadow-md flex items-center justify-center gap-space-sm"
                to="/signup"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto rounded-xl bg-surface-container p-4 flex flex-col sm:flex-row items-center justify-center gap-space-sm text-center sm:text-left">
          <Shield size={24} className="text-primary" />
          <p className="font-body-sm text-body-sm text-on-surface font-medium">
            We never sell your data. Your statements stay private.{' '}
            <span className="text-on-surface-variant font-normal">Local in-memory parsing with zero third-party ads or data broker syndication.</span>
          </p>
        </div>
        <div className="text-center pt-2">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            For banks and employers: license SmartGullak&apos;s explainable affordability engine —{' '}
            <button className="text-primary hover:underline font-semibold" onClick={onContact}>
              Contact us
            </button>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
