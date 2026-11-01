// Phone navigation (below 1024px, where the sidebar is hidden): Home, Ask, Goals and a "More" sheet.
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BellRing, Flag, LayoutDashboard, LogOut, Menu, PiggyBank, ReceiptText, Shield, Sparkles, Wallet, X } from 'lucide-react';
import { logout } from '../../services/api';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/ask', icon: Sparkles, label: 'Ask' },
  { to: '/goals', icon: Flag, label: 'Goals' },
];
const MORE = [
  { to: '/money-flow', icon: ArrowLeftRight, label: 'Money Flow' },
  { to: '/surplus-plan', icon: PiggyBank, label: 'Surplus Plan' },
  { to: '/statements', icon: ReceiptText, label: 'Statements' },
  { to: '/transactions', icon: Wallet, label: 'Transactions' },
  { to: '/flags', icon: BellRing, label: 'Flags', badgeKey: 'flagCount' },
  { to: '/privacy', icon: Shield, label: 'Privacy & Data' },
];
const TAB = 'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px]';

export default function BottomTabBar({ session }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inMore = MORE.some((m) => m.to === pathname);

  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <nav aria-label="More" className="absolute bottom-0 inset-x-0 rounded-t-3xl bg-white p-4 pb-8 space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2">
              <span className="text-[17px] font-semibold text-[#0b2545]">More</span>
              <button type="button" aria-label="Close" className="p-2 rounded-lg text-slate-600" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            {MORE.map(({ to, icon: Icon, label, badgeKey }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center justify-between px-3 py-3 rounded-xl text-[15px] ${isActive ? 'bg-blue-50 text-[#1d4ed8] font-semibold' : 'text-slate-800'}`}>
                <span className="flex items-center gap-3"><Icon size={20} aria-hidden="true" /> {label}</span>
                {badgeKey && session[badgeKey] > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[12px] font-semibold">{session[badgeKey]}</span>}
              </NavLink>
            ))}
            <button type="button" onClick={signOut} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] text-slate-800">
              <LogOut size={20} aria-hidden="true" /> Log out
            </button>
          </nav>
        </div>
      )}
      <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(11,37,69,0.06)]">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `${TAB} ${isActive ? 'text-[#1d4ed8] font-semibold' : 'text-slate-600'}`}>
            <Icon size={22} aria-hidden="true" /> {label}
          </NavLink>
        ))}
        <button type="button" onClick={() => setOpen(true)} className={`${TAB} ${inMore ? 'text-[#1d4ed8] font-semibold' : 'text-slate-600'}`} aria-haspopup="dialog">
          <Menu size={22} aria-hidden="true" /> More
        </button>
      </nav>
    </>
  );
}
