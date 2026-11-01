// Pricing: Free and Premium (highlighted with a glowing border), plus a line for banks and employers.
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Reveal from './Reveal';

const PLANS = [
  { name: 'Free', price: '₹0', period: '', features: ['Up to 2 accounts', 'Home dashboard', 'Affordability answers'], cta: 'Get started free', highlight: false },
  { name: 'Premium', price: '₹99', period: '/month', features: ['Unlimited accounts', 'What-if changes', 'Goals', 'Money flow', 'Export your data'], cta: 'Get Premium', highlight: true },
];

export default function Pricing({ onContact }) {
  return (
    <section id="pricing" className="py-24 scroll-mt-16">
      <div className="max-w-5xl mx-auto px-5 lg:px-10">
        <Reveal className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#1d4ed8]">Pricing</p>
          <h2 className="mt-2 text-[34px] sm:text-[40px] leading-tight font-bold tracking-tight text-[#0b2545]">Simple pricing</h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 120} className={`relative rounded-3xl bg-white p-8 flex flex-col ${plan.highlight ? 'glow' : 'border border-slate-200 shadow-sm'}`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-[#1d4ed8] text-white text-[12px] font-semibold">Most useful</span>
              )}
              <h3 className="text-[18px] font-semibold text-[#0b2545]">{plan.name}</h3>
              <p className="mt-3"><span className="text-[44px] font-extrabold tracking-tight text-[#0b2545]">{plan.price}</span><span className="text-slate-500">{plan.period}</span></p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[15px] text-slate-700"><Check size={18} className="text-[#1d4ed8]" /> {f}</li>
                ))}
              </ul>
              <Link to="/signup" className={`lift mt-8 inline-flex justify-center px-5 py-3 rounded-xl font-semibold text-[15px] ${plan.highlight ? 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-600/30 hover:bg-[#1e40af]' : 'bg-slate-100 text-[#0b2545] hover:bg-slate-200'}`}>
                {plan.cta}
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-[14px] text-slate-600">
          For banks and employers: license our explainable affordability engine —{' '}
          <button type="button" onClick={onContact} className="font-semibold text-[#1d4ed8] hover:underline">Contact us</button>.
        </p>
      </div>
    </section>
  );
}
