// Sign Up step 1: name, email, master password + confirmation with live strength meter.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AtSign, CircleAlert, Eye, EyeOff, KeyRound, Lock, User } from 'lucide-react';
import PasswordStrength from './PasswordStrength';
import { passwordStrength } from '../../utils/passwordStrength';

const INPUT =
  'w-full h-11 pl-10 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm transition-all';

export default function AccountStep({ initial, onContinue }) {
  const [form, setForm] = useState(initial);
  const [show, setShow] = useState({ password: false, confirm: false });
  const [error, setError] = useState('');
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (passwordStrength(form.password).segments < 3) return setError('Choose a stronger password (14+ characters with symbols).');
    setError('');
    onContinue(form);
  }

  return (
    <div className="w-full flex flex-col">
      <div className="mb-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Create your private vault</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
          Set up your credentials for zero-knowledge financial intelligence and isolated ledger storage.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
            Full Legal Name <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">KYC Identifier</span>
          </label>
          <div className="relative flex items-center">
            <User size={20} className="absolute left-3 text-outline pointer-events-none" />
            <input className={`${INPUT} pr-4 font-body-md text-body-md`} placeholder="Enter your full name" required type="text" value={form.name} onChange={update('name')} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
            Work / Primary Email <span className="font-label-sm text-label-sm text-primary font-medium">OTP Verification</span>
          </label>
          <div className="relative flex items-center">
            <AtSign size={20} className="absolute left-3 text-outline pointer-events-none" />
            <input className={`${INPUT} pr-4 font-body-md text-body-md`} placeholder="name@domain.com" required type="email" value={form.email} onChange={update('email')} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Master Vault Password</label>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">Never stored on cloud</span>
          </div>
          <div className="relative flex items-center">
            <KeyRound size={20} className="absolute left-3 text-outline pointer-events-none" />
            <input
              className={`${INPUT} pr-11 font-currency-sm text-currency-sm`}
              required
              type={show.password ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
            />
            <button
              className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1 flex items-center justify-center"
              type="button"
              onClick={() => setShow({ ...show, password: !show.password })}
            >
              {show.password ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Confirm Master Password</label>
          <div className="relative flex items-center">
            <Lock size={20} className="absolute left-3 text-outline pointer-events-none" />
            <input
              className={`${INPUT} pr-11 font-currency-sm text-currency-sm`}
              required
              type={show.confirm ? 'text' : 'password'}
              value={form.confirm}
              onChange={update('confirm')}
            />
            <button
              className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1 flex items-center justify-center"
              type="button"
              onClick={() => setShow({ ...show, confirm: !show.confirm })}
            >
              {show.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <PasswordStrength password={form.password} />
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            <CircleAlert size={16} /> {error}
          </div>
        )}
        <button
          className="mt-3 w-full h-11 rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all"
          type="submit"
        >
          <span>Continue to Card Registration</span>
          <ArrowRight size={18} />
        </button>
      </form>
      <div className="mt-6 pt-5 text-center flex flex-col items-center gap-2">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Already have an active SmartGullak vault?{' '}
          <Link className="text-primary font-semibold hover:underline ml-1" to="/login">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
