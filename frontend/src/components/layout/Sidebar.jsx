// Left navigation on larger screens: the four main tabs, then a "More" group that opens on demand.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, CircleHelp } from 'lucide-react';
import SidebarLink from './SidebarLink';
import FormDialog from '../ui/FormDialog';
import Toast from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { MAIN_TABS, MORE_ICON, MORE_ITEMS, PARENT_TAB } from './navItems';

export default function Sidebar({ session }) {
  const { pathname } = useLocation();
  const inMore = MORE_ITEMS.some((item) => item.to === pathname);
  const [moreOpen, setMoreOpen] = useState(inMore);
  const [supportOpen, setSupportOpen] = useState(false);
  const [toast, showToast] = useToast();
  const MoreIcon = MORE_ICON;

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#0B2545] z-50 flex-col justify-between border-r border-white/10">
      <div className="flex flex-col">
        <Link to="/dashboard" className="h-16 px-space-lg flex items-center border-b border-white/10">
          <span className="font-headline-sm text-headline-sm font-semibold text-white tracking-tight">SmartGullak</span>
        </Link>
        <nav className="p-space-md space-y-0.5 overflow-y-auto" aria-label="Main">
          {MAIN_TABS.map((tab) => (
            <SidebarLink key={tab.to} {...tab} forceActive={PARENT_TAB[pathname] === tab.to} />
          ))}
          <button
            type="button"
            aria-expanded={moreOpen || inMore}
            className="w-full mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
            onClick={() => setMoreOpen(!moreOpen)}
          >
            <span className="flex items-center gap-2.5">
              <MoreIcon size={18} />
              <span className="font-body-md text-body-md">More</span>
            </span>
            <ChevronDown size={16} className={`transition-transform ${moreOpen || inMore ? 'rotate-180' : ''}`} />
          </button>
          {(moreOpen || inMore) && (
            <div className="pl-3 space-y-0.5">
              {MORE_ITEMS.map((item) => (
                <SidebarLink key={item.to} {...item} badge={item.badgeKey ? session[item.badgeKey] : null} />
              ))}
            </div>
          )}
        </nav>
      </div>
      <div className="p-space-md border-t border-white/10">
        <button
          className="w-full flex items-center gap-space-sm px-space-md py-space-sm text-white/70 hover:text-white transition-colors font-body-sm text-body-sm"
          onClick={() => setSupportOpen(true)}
        >
          <CircleHelp size={18} />
          <span>Help</span>
        </button>
      </div>
      <FormDialog
        key={supportOpen ? 'open' : 'closed'}
        open={supportOpen}
        title="Contact Support"
        fields={[
          { name: 'topic', label: 'Topic', options: ['Statements & parsing', 'Affordability answers', 'Card & security', 'Other'] },
          { name: 'message', label: 'How can we help?', placeholder: 'Describe the issue' },
        ]}
        initialValues={{ topic: 'Statements & parsing', message: '' }}
        submitLabel="Send"
        onClose={() => setSupportOpen(false)}
        onSubmit={() => {
          setSupportOpen(false);
          showToast('Support request sent — we reply within one business day');
        }}
      />
      <Toast message={toast} />
    </aside>
  );
}
