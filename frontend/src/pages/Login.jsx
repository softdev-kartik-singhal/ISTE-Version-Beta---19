// Log In screen: email + master password, show/hide password, forgot-password and link to sign up.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CircleAlert, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import GullakLogo from '../components/auth/GullakLogo';
import ComplianceStrip from '../components/auth/ComplianceStrip';
import FormDialog from '../components/ui/FormDialog';
import Toast from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { demoLogin, login, requestPasswordReset } from '../services/api';

const INPUT =
  'w-full h-11 pl-11 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1d4ed8] transition-all';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, showToast] = useToast();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  // One click into the shared demo account (the backend loads the demo statements for it).
  async function tryDemo() {
    setBusy(true);
    setError('');
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-xl p-8 sm:p-10 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-fixed-dim via-primary to-primary-container" />
          <div className="flex flex-col items-center text-center mb-8">
            <GullakLogo />
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="font-headline-lg text-headline-lg tracking-tight text-on-surface">SmartGullak</span>
              <span className="bg-surface-container text-on-primary-fixed-variant px-2 py-0.5 rounded text-label-sm font-label-sm uppercase tracking-wider">Vault</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">Sign in to your private financial vault</p>
          </div>

          <form className="flex flex-col space-y-5" onSubmit={submit}>
            <div className="flex flex-col space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Registered Email</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-on-surface-variant flex items-center pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  autoComplete="email"
                  className={`${INPUT} pr-4`}
                  id="email"
                  placeholder="aditya.rao@work.in"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface flex justify-between items-center" htmlFor="password">
                <span>Master Password</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Zero-knowledge proof</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-on-surface-variant flex items-center pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  autoComplete="current-password"
                  className={`${INPUT} pr-11 font-mono`}
                  id="password"
                  placeholder="••••••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  aria-label="Toggle password visibility"
                  className="absolute right-3 text-on-surface-variant hover:text-on-surface flex items-center justify-center p-1 rounded transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  className="w-4 h-4 rounded bg-surface-container-low text-primary focus:ring-0 focus:outline-none accent-primary-container cursor-pointer"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant">Remember device (30d)</span>
              </label>
              <button
                type="button"
                className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors underline-offset-4 hover:underline"
                onClick={() => setResetOpen(true)}
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
                <CircleAlert size={16} /> {error}
              </div>
            )}
            <div className="pt-2">
              <button
                className="w-full h-11 bg-primary-container hover:bg-primary active:bg-on-primary-fixed-variant text-on-primary font-headline-sm text-body-md font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                type="submit"
                disabled={busy}
              >
                <span>{busy ? 'Unlocking vault...' : 'Log in to SmartGullak'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
          <button type="button" className="mt-4 h-11 rounded-lg bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high disabled:opacity-60" disabled={busy} onClick={tryDemo}>
            Try the demo account
          </button>

          <div className="mt-6 p-3.5 bg-surface-container-low rounded-lg flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
              No hardware card needed for login. Physical card authentication is strictly reserved for sensitive exports and account deletion.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Don&apos;t have a SmartGullak vault yet?{' '}
            <Link className="font-label-md text-label-md text-primary font-semibold hover:underline ml-1" to="/signup">
              Sign up for early access →
            </Link>
          </p>
        </div>
        <ComplianceStrip />
      </div>

      <FormDialog
        key={resetOpen ? 'reset-open' : 'reset-closed'}
        open={resetOpen}
        title="Reset master password"
        fields={[{ name: 'email', label: 'Registered email', type: 'email' }]}
        initialValues={{ email }}
        submitLabel="Send reset link"
        onClose={() => setResetOpen(false)}
        onSubmit={async (values) => {
          await requestPasswordReset(values.email);
          setResetOpen(false);
          showToast(`Reset link sent to ${values.email}`);
        }}
      />
      <Toast message={toast} />
    </AuthLayout>
  );
}
