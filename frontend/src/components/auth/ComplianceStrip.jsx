// Security & compliance badges shown under the Log In and Sign Up cards.
import { Landmark, Lock, ShieldUser } from 'lucide-react';

export default function ComplianceStrip() {
  return (
    <div className="mt-8 flex flex-col items-center text-center">
      <div className="flex flex-wrap items-center justify-center gap-y-1.5 gap-x-3 text-outline font-label-sm text-label-sm">
        <span className="flex items-center gap-1">
          <Lock size={12} className="text-secondary" /> 256-bit AES Client-side
        </span>
        <span className="text-surface-dim">•</span>
        <span className="flex items-center gap-1">
          <ShieldUser size={12} className="text-secondary" /> Zero Data Monetisation
        </span>
        <span className="text-surface-dim">•</span>
        <span className="flex items-center gap-1">
          <Landmark size={12} className="text-secondary" /> RBI Localization Compliant
        </span>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-outline font-label-sm text-label-sm">
        <span className="font-currency-sm text-label-sm">ISO/IEC 27001</span>
        <span>•</span>
        <span className="font-currency-sm text-label-sm">SOC 2 Type II</span>
      </div>
    </div>
  );
}
