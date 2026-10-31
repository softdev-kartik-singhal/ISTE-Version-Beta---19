// Landing page: hero, live affordability simulator, benefits, comparison, NFC card, pricing and final CTA.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { getLanding } from '../services/api';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import AffordabilitySimulator from '../components/landing/AffordabilitySimulator';
import BenefitGrid from '../components/landing/BenefitGrid';
import ComparisonMatrix from '../components/landing/ComparisonMatrix';
import PricingSection from '../components/landing/PricingSection';
import LandingFooter from '../components/landing/LandingFooter';
import FormDialog from '../components/ui/FormDialog';
import Toast from '../components/ui/Toast';

export default function Landing() {
  const { data } = useApi(getLanding);
  const [active, setActive] = useState('features');
  const [contactOpen, setContactOpen] = useState(false);
  const [toast, showToast] = useToast();
  if (!data) return null;

  function navigate(id) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased">
      <LandingNav active={active} onNavigate={navigate} />
      <main className="w-full pt-16 bg-surface min-h-[calc(100vh-16rem)]">
        <div className="flex flex-col w-full">
          <HeroSection onSeeDemo={() => navigate('waterfall-demo')} />
          <AffordabilitySimulator sim={data.simulator} />
          <BenefitGrid />
          <ComparisonMatrix />
          <PricingSection plans={data.plans} onContact={() => setContactOpen(true)} />
          <section className="px-6 lg:px-12 py-space-2xl bg-surface">
            <div className="max-w-5xl mx-auto rounded-xl bg-surface-container-high p-8 lg:p-14 text-center space-y-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center mx-auto shadow-md">
                <span className="font-headline-md text-headline-md font-bold">₹</span>
              </div>
              <h2 className="font-display-lg text-display-lg font-bold text-on-surface max-w-2xl mx-auto">Make major financial decisions with mathematical certainty</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
                No bank logins needed. Drop your statements, calibrate your real liquidity, and never second-guess a high-ticket expense again.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md pt-2">
                <Link
                  className="w-full sm:w-auto px-space-xl py-3 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold transition-all shadow-md"
                  to="/signup"
                >
                  Get Started for Free
                </Link>
                <Link
                  className="w-full sm:w-auto px-space-lg py-3 rounded-lg bg-surface-container-lowest hover:bg-surface text-on-surface font-headline-sm text-headline-sm font-medium transition-all shadow-sm"
                  to="/login"
                >
                  Log In to Existing Vault
                </Link>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant pt-2">
                Free 14-day evaluation with instant offline PDF parsing. No payment card requested.
              </p>
            </div>
          </section>
        </div>
      </main>
      <LandingFooter onNavigate={navigate} />
      <FormDialog
        key={contactOpen ? 'contact-open' : 'contact-closed'}
        open={contactOpen}
        title="License the affordability engine"
        fields={[
          { name: 'org', label: 'Organisation', placeholder: 'Bank or employer name' },
          { name: 'email', label: 'Work email', type: 'email', placeholder: 'you@company.com' },
          { name: 'type', label: 'Interested as', options: ['Bank / NBFC', 'Employer benefits', 'Fintech partner'] },
        ]}
        initialValues={{ org: '', email: '', type: 'Bank / NBFC' }}
        submitLabel="Request a call"
        onClose={() => setContactOpen(false)}
        onSubmit={(values) => {
          setContactOpen(false);
          showToast(`Thanks ${values.org} — our partnerships team will email ${values.email}`);
        }}
      />
      <Toast message={toast} />
    </div>
  );
}
