// One sidebar navigation item; highlights itself when its route is active.
import { NavLink } from 'react-router-dom';

const BASE = 'flex items-center justify-between px-3 py-1.5 rounded-lg transition-all';
const IDLE = 'text-white/80 hover:bg-white/10 hover:text-white';
const ACTIVE = 'bg-primary-container text-white font-semibold';

export default function SidebarLink({ to, icon: Icon, label, badge, tour }) {
  return (
    <NavLink to={to} data-tour={tour} className={({ isActive }) => `${BASE} ${isActive ? ACTIVE : IDLE}`}>
      <div className="flex items-center gap-2.5">
        <Icon size={17} />
        <span className="font-body-sm text-body-sm">{label}</span>
      </div>
      {badge != null && (
        <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-white font-label-sm text-[11px]">{badge}</span>
      )}
    </NavLink>
  );
}
