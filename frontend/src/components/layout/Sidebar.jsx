// Fixed left navigation for all app screens (grouped INSIGHTS / DATA version from the Dashboard design).
import {
  ArrowLeftRight, BellRing, ChartLine, CircleHelp, Flag, LayoutDashboard, LogOut, PiggyBank, ReceiptText, Route, Shield, Sparkles,
  TrendingUp, Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SidebarLink from './SidebarLink';
import FormDialog from '../ui/FormDialog';
import Toast from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useTour } from '../../tour/tourContext';
import { logout } from '../../services/api';

const SECTIONS = [
  {
    title: 'INSIGHTS',
    links: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/ask', icon: Sparkles, label: 'Ask' },
      { to: '/trends', icon: TrendingUp, label: 'Trends & Surplus' },
      { to: '/money-flow', icon: ArrowLeftRight, label: 'Money Flow' },
      { to: '/goals', icon: Flag, label: 'Goals' },
      { to: '/surplus-plan', icon: PiggyBank, label: 'Surplus Plan' },
    ],
  },
  {
    title: 'DATA',
    links: [
      { to: '/statements', icon: ReceiptText, label: 'Statements', tour: 'nav-statements' },
      { to: '/transactions', icon: Wallet, label: 'Transactions' },
      { to: '/flags', icon: BellRing, label: 'Flags', badgeKey: 'flagCount' },
      { to: '/track-record', icon: ChartLine, label: 'Track Record' },
      { to: '/privacy', icon: Shield, label: 'Privacy & Data' },
    ],
  },
];

export default function Sidebar({ session }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [toast, showToast] = useToast();
  const { replay } = useTour();
  const navigate = useNavigate();

  // Ends the session on the server, forgets the token, and returns to the login screen.
  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0B2545] z-50 flex flex-col justify-between border-r border-white/10">
      <div className="flex flex-col min-h-0 flex-1">
        {/* px-7 = nav padding (16px) + link padding (12px), so the name lines up with the menu icons */}
        <Link to="/dashboard" className="h-16 px-7 flex items-center border-b border-white/10">
          <span className="font-headline-sm text-headline-sm font-semibold text-white tracking-tight">SmartGullak</span>
        </Link>
        <nav className="p-space-md space-y-2 overflow-y-auto min-h-0">
          {SECTIONS.map((section, i) => (
            <div key={section.title} className={i > 0 ? 'pt-1' : undefined} data-tour={i > 0 ? 'nav-more' : undefined}>
              <span className="px-3 font-label-sm text-[11px] font-semibold text-white/50 tracking-wider uppercase">
                {section.title}
              </span>
              <div className="mt-1.5 space-y-0.5">
                {section.links.map((link) => (
                  <SidebarLink key={link.to} {...link} badge={link.badgeKey ? session[link.badgeKey] : null} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="shrink-0 px-space-md py-space-sm border-t border-white/10 space-y-0.5">
        <div className="px-space-sm py-1.5 mb-1 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-emerald-400 font-label-md text-label-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected</span>
          </div>
          <p className="mt-1 text-white/60 font-label-sm text-label-sm leading-tight">{session.syncSummary}</p>
        </div>
        <button
          className="w-full flex items-center gap-space-sm px-3 py-1.5 text-white/70 hover:text-white transition-colors font-label-md text-label-md"
          onClick={replay}
        >
          <Route size={17} />
          <span>Replay tour</span>
        </button>
        <button
          className="w-full flex items-center gap-space-sm px-3 py-1.5 text-white/70 hover:text-white transition-colors font-label-md text-label-md"
          onClick={() => setSupportOpen(true)}
        >
          <CircleHelp size={17} />
          <span>Support &amp; FAQ</span>
        </button>
        <button
          className="w-full flex items-center gap-space-sm px-3 py-1.5 text-white/70 hover:text-white transition-colors font-label-md text-label-md"
          onClick={signOut}
        >
          <LogOut size={17} />
          <span>Log out</span>
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
