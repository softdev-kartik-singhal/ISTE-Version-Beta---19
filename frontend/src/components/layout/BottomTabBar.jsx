// Bottom tab bar on phones: the four main tabs plus "More", which opens a sheet with the other pages.
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { MAIN_TABS, MORE_ICON, MORE_ITEMS, PARENT_TAB } from './navItems';

const TAB = 'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 font-label-sm text-[11px]';

export default function BottomTabBar({ session }) {
  const { pathname } = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const inMore = MORE_ITEMS.some((item) => item.to === pathname);
  const MoreIcon = MORE_ICON;

  return (
    <>
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSheetOpen(false)}>
          <nav
            aria-label="More"
            className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-surface-container-lowest p-space-md pb-8 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="font-headline-sm text-headline-sm text-on-surface">More</span>
              <button type="button" aria-label="Close" className="p-2 rounded-lg text-secondary" onClick={() => setSheetOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {MORE_ITEMS.map(({ to, icon: Icon, label, badgeKey }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSheetOpen(false)}
                className={({ isActive }) => `flex items-center justify-between px-3 py-3 rounded-lg font-body-md text-body-md ${isActive ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface'}`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={20} />
                  {label}
                </span>
                {badgeKey && session[badgeKey] > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-white font-label-sm text-[11px]">{session[badgeKey]}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
      <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex bg-surface-container-lowest border-t border-[#E3E8EF]">
        {MAIN_TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${TAB} ${isActive || PARENT_TAB[pathname] === to ? 'text-primary font-semibold' : 'text-secondary'}`}
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
        <button type="button" className={`${TAB} ${inMore ? 'text-primary font-semibold' : 'text-secondary'}`} onClick={() => setSheetOpen(true)}>
          <MoreIcon size={22} />
          More
        </button>
      </nav>
    </>
  );
}
