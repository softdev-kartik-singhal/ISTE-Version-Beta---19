// Fixed left navigation for all app screens (grouped INSIGHTS / DATA version from the Dashboard design).
import {
  ArrowLeftRight, BellRing, ChartLine, CircleHelp, Flag, LayoutDashboard, PiggyBank, ReceiptText, Shield, Sparkles,
  TrendingUp, Wallet,
} from 'lucide-react';
import SidebarLink from './SidebarLink';

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
      { to: '/statements', icon: ReceiptText, label: 'Statements' },
      { to: '/transactions', icon: Wallet, label: 'Transactions' },
      { to: '/flags', icon: BellRing, label: 'Flags', badgeKey: 'flagCount' },
      { to: '/track-record', icon: ChartLine, label: 'Track Record' },
      { to: '/privacy', icon: Shield, label: 'Privacy & Data' },
    ],
  },
];

export default function Sidebar({ session }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0B2545] z-50 flex flex-col justify-between border-r border-white/10">
      <div className="flex flex-col">
        <div className="h-16 px-space-lg flex items-center gap-space-sm border-b border-white/10">
          <img alt="SmartGullak Logo" className="h-8 w-auto object-contain" src={session.logoUrl} />
          <span className="font-headline-sm text-headline-sm text-white tracking-tight">SmartGullak</span>
        </div>
        <nav className="p-space-md space-y-3 overflow-y-auto">
          {SECTIONS.map((section, i) => (
            <div key={section.title} className={i > 0 ? 'pt-1' : undefined}>
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
      <div className="p-space-md border-t border-white/10 space-y-space-sm">
        <div className="p-space-sm rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-emerald-400 font-label-md text-label-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected</span>
          </div>
          <p className="mt-1 text-white/60 font-label-sm text-label-sm leading-tight">{session.syncSummary}</p>
        </div>
        {/* No Support & FAQ screen exists yet, so this link has no route. */}
        <a className="flex items-center gap-space-sm px-space-md py-space-sm text-white/70 hover:text-white transition-colors font-body-sm text-body-sm" href="#">
          <CircleHelp size={18} />
          <span>Support &amp; FAQ</span>
        </a>
      </div>
    </aside>
  );
}
