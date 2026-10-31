// Public landing page ("/"). Signed-in visitors go straight to Home.
// The phone preview on the right follows the section in view: each section names its phone screen in data-screen;
// sections without one (pricing onwards) fade the docked phone out.
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { demoLogin, isSignedIn } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useReducedMotion } from '../components/landing/landingHooks';
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import PhoneMockup from '../components/landing/PhoneMockup';
import HowItWorks from '../components/landing/HowItWorks';
import FeatureBento from '../components/landing/FeatureBento';
import Comparison from '../components/landing/Comparison';
import PlanPitch from '../components/landing/PlanPitch';
import SecurityBand from '../components/landing/SecurityBand';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import FormDialog from '../components/ui/FormDialog';
import Toast from '../components/ui/Toast';
import '../components/landing/landing.css';

export default function Landing() {
  if (isSignedIn()) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function LandingPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [screen, setScreen] = useState({ name: 'ask', hidden: false });
  const [demoBusy, setDemoBusy] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [toast, showToast] = useToast();

  // Watch which section crosses the middle of the viewport and show its phone screen.
  useEffect(() => {
    const sections = document.querySelectorAll('.landing section');
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (!hit) return;
        const name = hit.target.dataset.screen;
        setScreen((s) => (name ? { name, hidden: false } : { ...s, hidden: true }));
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  function scrollTo(id) {
    const el = id === 'top' ? document.body : document.getElementById(id);
    if (id === 'top') window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  // "Try the demo": sign in to the shared demo account and open Home.
  async function tryDemo() {
    setDemoBusy(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message);
      setDemoBusy(false);
    }
  }

  return (
    <div className="landing bg-white text-slate-900 antialiased overflow-x-clip">
      <LandingNav onNavigate={scrollTo} />
      <main>
        <Hero onDemo={tryDemo} demoBusy={demoBusy} phone={<PhoneMockup screen={screen.name} hidden={screen.hidden} />} />
        <HowItWorks />
        <FeatureBento />
        <Comparison />
        <PlanPitch />
        <SecurityBand />
        <Pricing onContact={() => setContactOpen(true)} />
        <FAQ />
        <FinalCTA onDemo={tryDemo} demoBusy={demoBusy} />
      </main>
      <LandingFooter onNavigate={scrollTo} />
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
        submitLabel="Send"
        onClose={() => setContactOpen(false)}
        onSubmit={(values) => {
          setContactOpen(false);
          showToast(`Thanks, ${values.org}. We'll reply to ${values.email}.`);
        }}
      />
      <Toast message={toast} />
    </div>
  );
}
