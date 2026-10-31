// Fixed top bar for app screens: search, account selector, sync time, notifications and profile.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronDown, Clock, Landmark, Search } from 'lucide-react';

export default function TopBar({ session, account, onAccountChange }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);

  // ⌘K / Ctrl+K focuses the search box, as the hint suggests.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function search(e) {
    e.preventDefault();
    navigate('/transactions', { state: { query } });
  }

  const accountLabel = account === 'all' ? `All accounts (${session.accountCount})` : account;

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest border-b border-[#E3E8EF] z-40 px-space-md lg:px-space-xl flex items-center justify-between shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-space-md">
        <span className="lg:hidden font-headline-sm text-headline-sm font-semibold text-on-surface">SmartGullak</span>
        <form onSubmit={search} className="relative hidden md:flex items-center">
          <Search size={20} className="absolute left-3 text-secondary" />
          <input
            ref={searchRef}
            className="h-10 pl-10 pr-12 w-72 rounded-lg border border-[#E3E8EF] bg-surface font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            placeholder="Search payments..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant font-currency-sm text-label-sm text-secondary">
            ⌘K
          </kbd>
        </form>
        <div className="relative hidden md:block">
          <button
            type="button"
            className="flex items-center bg-surface border border-[#E3E8EF] rounded-lg px-space-sm py-1.5 gap-2 cursor-pointer hover:bg-surface-container-low transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Landmark size={18} className="text-primary" />
            <span className="font-label-md text-label-md text-on-surface">{accountLabel}</span>
            <ChevronDown size={16} className="text-secondary" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-11 w-56 bg-surface-container-lowest rounded-lg shadow-xl border border-[#E3E8EF] py-1 z-50">
              {['all', ...session.accounts].map((a) => (
                <button
                  key={a}
                  type="button"
                  className="w-full px-3 py-2 flex items-center justify-between font-label-md text-label-md text-on-surface hover:bg-surface-container-low"
                  onClick={() => {
                    onAccountChange(a);
                    setMenuOpen(false);
                  }}
                >
                  <span>{a === 'all' ? `All accounts (${session.accountCount})` : a}</span>
                  {a === account && <Check size={16} className="text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-space-md lg:gap-space-lg">
        <div className="hidden xl:flex items-center gap-1.5 font-label-md text-label-md text-secondary">
          <Clock size={16} />
          <span>Last synced: {session.lastSynced}</span>
        </div>
        <button
          className="relative p-2 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-colors"
          title="Things to check"
          aria-label="Things to check"
          onClick={() => navigate('/flags')}
        >
          <Bell size={20} />
          {session.flagCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />}
        </button>
        <div className="h-6 w-px bg-outline-variant" />
        <button className="flex items-center gap-space-sm" onClick={() => navigate('/privacy')}>
          <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md">{session.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">{session.user.name}</span>
            <span className="font-label-sm text-label-sm text-secondary leading-tight">{session.user.profile}</span>
          </div>
        </button>
      </div>
    </header>
  );
}
