// Trends "Cashflow Intelligence" panel: plain-language findings plus the Ask link.
import { Link } from 'react-router-dom';
import { ArrowUpFromLine, BadgeCheck, BrainCog, Info, Shield, Sparkles, UtensilsCrossed } from 'lucide-react';
import RichText from '../ui/RichText';

const FINDING_ICONS = { verified: BadgeCheck, growth: ArrowUpFromLine, dining: UtensilsCrossed, shield: Shield, info: Info };

export default function IntelligencePanel({ findings }) {
  return (
    <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex items-center justify-between pb-space-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Cashflow Intelligence</h2>
          <p className="font-label-sm text-label-sm text-secondary">Algorithmic transaction audits</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
          <Sparkles size={14} />
          <span>Audit</span>
        </div>
      </div>
      <div className="space-y-space-md">
        {findings.map((f) => {
          const Icon = FINDING_ICONS[f.icon] || Info; // fall back so an unknown icon name never crashes the page
          return (
            <div key={f.title} className="p-space-md rounded-lg bg-surface-container-low">
              <div className="flex items-start gap-2.5">
                <Icon size={20} className={`${f.iconClass} mt-0.5`} />
                <div>
                  <h3 className="font-headline-sm text-[15px] leading-tight text-on-surface font-semibold">{f.title}</h3>
                  <p className="font-body-sm text-body-sm text-secondary mt-1">
                    <RichText parts={f.body} />
                  </p>
                  {f.progress && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full bg-primary-container rounded-full" style={{ width: `${f.progress.percent}%` }} />
                      </div>
                      <span className="font-label-sm text-label-sm text-primary font-semibold">{f.progress.label}</span>
                    </div>
                  )}
                  {f.chip && (
                    <div className="mt-2.5 inline-flex items-center gap-1 font-label-sm text-label-sm text-on-secondary-container bg-secondary-container/50 px-2 py-0.5 rounded">
                      <span>{f.chip}</span>
                    </div>
                  )}
                  {f.footnote && <p className="font-label-sm text-label-sm text-secondary mt-1">{f.footnote}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-space-md p-space-md rounded-lg bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCog size={20} className="text-primary" />
          <span className="font-label-md text-label-md text-on-surface font-medium">Want to test a planned purchase?</span>
        </div>
        <Link className="font-label-md text-label-md text-primary font-semibold hover:underline" to="/ask">
          Ask AI →
        </Link>
      </div>
    </div>
  );
}
