// Public site header: logo, in-page section links, Log In and Sign Up.
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

const LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'waterfall-demo', label: 'How It Works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'comparison', label: 'Privacy' },
];

export default function LandingNav({ active, onNavigate }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        <button className="flex items-center gap-space-sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-headline-md font-bold text-headline-md">₹</div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">SmartGullak</span>
          </div>
        </button>
        <nav className="hidden md:flex items-center gap-space-xs p-1">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={
                active === link.id
                  ? 'px-space-md py-space-sm transition-colors bg-surface-container-high text-on-surface font-semibold rounded-lg'
                  : 'px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors'
              }
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-space-md">
          <Link className="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant hover:text-on-surface font-medium transition-colors" to="/login">
            Log In
          </Link>
          <Link
            className="px-space-md py-space-sm font-label-md text-label-md bg-primary-container text-on-primary hover:bg-primary font-semibold rounded-lg transition-all shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            to="/signup"
          >
            Sign Up / Get Started
          </Link>
          <Link to="/login" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center" title="Log in">
            <User size={18} className="text-on-primary" />
          </Link>
        </div>
      </div>
    </header>
  );
}
