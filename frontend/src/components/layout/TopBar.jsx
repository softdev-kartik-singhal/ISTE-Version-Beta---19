// Fixed top bar for app screens: search, account selector, sync time, notifications and profile.
import { Bell, ChevronDown, Clock, Landmark, Search } from 'lucide-react';

export default function TopBar({ session }) {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest border-b border-[#E3E8EF] z-40 px-space-xl flex items-center justify-between shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-space-md">
        <div className="relative flex items-center">
          <Search size={20} className="absolute left-3 text-secondary" />
          <input
            className="h-10 pl-10 pr-12 w-72 rounded-lg border border-[#E3E8EF] bg-surface font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            placeholder="Search transactions, cashflow rules..."
            type="text"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant font-currency-sm text-label-sm text-secondary">
            ⌘K
          </kbd>
        </div>
        <div className="flex items-center bg-surface border border-[#E3E8EF] rounded-lg px-space-sm py-1.5 gap-2 cursor-pointer hover:bg-surface-container-low transition-colors">
          <Landmark size={18} className="text-primary" />
          <span className="font-label-md text-label-md text-on-surface">All accounts ({session.accountCount})</span>
          <ChevronDown size={16} className="text-secondary" />
        </div>
      </div>
      <div className="flex items-center gap-space-lg">
        <div className="flex items-center gap-1.5 font-label-md text-label-md text-secondary">
          <Clock size={16} />
          <span>Last synced: {session.lastSynced}</span>
        </div>
        <button className="relative p-2 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
        </button>
        <div className="h-6 w-px bg-outline-variant" />
        <div className="flex items-center gap-space-sm">
          <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={session.user.avatarUrl} />
          <div className="flex flex-col text-left">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">{session.user.name}</span>
            <span className="font-label-sm text-label-sm text-secondary leading-tight">{session.user.profile}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
