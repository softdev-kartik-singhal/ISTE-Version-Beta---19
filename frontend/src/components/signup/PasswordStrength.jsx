// Live password entropy meter with four segments.
import { ShieldCheck } from 'lucide-react';
import { passwordStrength } from '../../utils/passwordStrength';

export default function PasswordStrength({ password }) {
  const s = passwordStrength(password);
  return (
    <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-2">
      <div className="flex items-center justify-between font-label-sm text-label-sm">
        <span className="text-on-surface font-semibold flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600" /> Password Entropy:{' '}
          <span className={`${s.text} font-bold`}>
            {s.label} ({s.bits} bits)
          </span>
        </span>
        <span className="text-on-surface-variant font-currency-sm">{password.length} chars</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-full rounded-full ${i < s.segments ? s.color : 'bg-surface-variant'}`} />
        ))}
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">14+ characters, combined alphanumeric and cryptographic symbols.</p>
    </div>
  );
}
