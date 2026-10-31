// One sidebar navigation item; highlights itself when its route (or a detail page under it) is active.
import { NavLink } from 'react-router-dom';

const BASE = 'flex items-center justify-between px-3 py-2 rounded-lg transition-all';
const IDLE = 'text-white/80 hover:bg-white/10 hover:text-white';
const ACTIVE = 'bg-primary-container text-white font-semibold';

export default function SidebarLink({ to, icon: Icon, label, badge, forceActive = false }) {
  return (
    <NavLink to={to} className={({ isActive }) => `${BASE} ${isActive || forceActive ? ACTIVE : IDLE}`}>
      <div className="flex items-center gap-2.5">
        <Icon size={18} />
        <span className="font-body-md text-body-md">{label}</span>
      </div>
      {badge != null && badge > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-white font-label-sm text-[11px]">{badge}</span>
      )}
    </NavLink>
  );
}
