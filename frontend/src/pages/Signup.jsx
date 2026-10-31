// Sign Up screen: two-step stepper — create account, then register the NFC security card.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, BadgeCheck, ClipboardCheck, Shield } from 'lucide-react';
import logo from '../assets/smartgullak-logo.png';
import AccountStep from '../components/signup/AccountStep';
import CardRegistrationStep from '../components/signup/CardRegistrationStep';
import { signup } from '../services/api';

const TAB_ACTIVE = 'flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all duration-200 bg-surface-container-lowest shadow-sm text-on-surface';
const TAB_IDLE = 'flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all duration-200 text-on-surface-variant hover:text-on-surface';
const BADGE_ACTIVE = 'w-5 h-5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center justify-center font-bold';
const BADGE_IDLE = 'w-5 h-5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm flex items-center justify-center font-bold';

const DEFAULT_ACCOUNT = { name: '', email: '', password: '', confirm: '' };

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState(DEFAULT_ACCOUNT);

  async function continueToCard(values) {
    setAccount(values);
    await signup(values);
    setStep(2);
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-center">
      <main className="w-full bg-surface">
        <div className="flex flex-col w-full">
          <div className="w-full flex flex-col items-center justify-center px-4 py-8 md:py-12">
            <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl p-6 sm:p-10 flex flex-col transition-all duration-300">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="SmartGullak" width="40" height="40" className="w-10 h-10 rounded-lg shadow-md" />
                  <div className="flex flex-col text-left">
                    <span className="font-headline-md text-headline-md tracking-tight text-on-surface font-semibold">SmartGullak</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="bg-surface-container text-primary font-label-sm text-label-sm px-2 py-0.5 rounded uppercase tracking-wider font-semibold">Vault Engine</span>
                      <span className="inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> v2.4 Sec-Enclave
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full bg-surface-container-low p-1.5 rounded-lg mb-8 flex items-center gap-1">
                <button className={step === 1 ? TAB_ACTIVE : TAB_IDLE} onClick={() => setStep(1)}>
                  <span className={step === 1 ? BADGE_ACTIVE : BADGE_IDLE}>1</span>
                  <span className="font-label-md text-label-md">Create Account</span>
                </button>
                <button className={step === 2 ? TAB_ACTIVE : TAB_IDLE} onClick={() => setStep(2)}>
                  <span className={step === 2 ? BADGE_ACTIVE : BADGE_IDLE}>2</span>
                  <span className="font-label-md text-label-md">Register Card</span>
                </button>
              </div>

              {step === 1 ? (
                <AccountStep initial={account} onContinue={continueToCard} />
              ) : (
                <CardRegistrationStep
                  onFinish={() => navigate('/dashboard')}
                  onBack={() => setStep(1)}
                  onSkip={() => {
                    window.alert('Card registration skipped. High security operations will prompt for card pairing later.');
                    navigate('/dashboard');
                  }}
                />
              )}
            </div>

            <div className="w-full max-w-xl mt-6 px-4 flex flex-col items-center text-center">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-on-surface-variant font-label-sm text-label-sm">
                <span className="flex items-center gap-1">
                  <BadgeCheck size={16} className="text-primary" /> 256-bit AES Client-Side
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1">
                  <Ban size={16} className="text-primary" /> Zero Data Monetisation
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1">
                  <Shield size={16} className="text-primary" /> RBI Localisation Compliant
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1">
                  <ClipboardCheck size={16} className="text-primary" /> ISO/IEC 27001
                </span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 opacity-75">
                SmartGullak Vault Engine Architecture • Strictly Local-First Cryptographic Key Holding
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
