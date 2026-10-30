// Public site footer: brand blurb, trust badges and policy links (which scroll to the matching sections).
import { Lock, Shield, ShieldCheck } from 'lucide-react';

export default function LandingFooter({ onNavigate }) {
  return (
    <footer className="w-full bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-space-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg pb-space-xl">
          <div className="max-w-md">
            <div className="flex items-center gap-space-sm mb-space-sm">
              <div className="w-6 h-6 rounded bg-primary-container flex items-center justify-center text-on-primary font-headline-sm text-label-md font-bold">₹</div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">SmartGullak</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Intelligent multi-stream cashflow orchestration and disciplined savings architecture for modern salaried and freelance earners.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-lg">
            <div className="flex items-center gap-space-sm text-on-surface-variant">
              <ShieldCheck size={20} className="text-primary" />
              <span className="font-label-sm text-label-sm">256-Bit Bank-Grade Encryption</span>
            </div>
            <div className="flex items-center gap-space-sm text-on-surface-variant">
              <Lock size={20} className="text-primary" />
              <span className="font-label-sm text-label-sm">RBI Account Aggregator Compliant</span>
            </div>
            <div className="flex items-center gap-space-sm text-on-surface-variant">
              <Shield size={20} className="text-primary" />
              <span className="font-label-sm text-label-sm">Zero Data Selling Policy</span>
            </div>
          </div>
        </div>
        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            © 2025 SmartGullak Technologies Pvt. Ltd. All rights reserved. Registered with financial regulatory frameworks.
          </p>
          <div className="flex items-center gap-space-md">
            <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => onNavigate('comparison')}>
              Privacy Policy
            </button>
            <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => onNavigate('security')}>
              Security Disclosures
            </button>
            <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => onNavigate('features')}>
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
