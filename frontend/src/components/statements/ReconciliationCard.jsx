// Statements "Multi-Account Reconciliation & Merge Summary": merged records, duplicates and self-transfers.
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowRightLeft, Copy, Info, LayoutGrid, ShieldCheck, Workflow } from 'lucide-react';

const ICONS = {
  merged: <LayoutGrid size={20} className="text-primary" />,
  duplicates: <Copy size={20} className="text-tertiary" />,
  transfers: <ArrowRightLeft size={20} className="text-secondary" />,
};

export default function ReconciliationCard({ reconciliation }) {
  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-xl space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-primary">
            <Workflow size={20} />
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">Multi-Account Reconciliation &amp; Merge Summary</h3>
            <p className="font-body-sm text-body-sm text-secondary">Cross-statement normalization, deduping, and ledger cleansing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Last run: {reconciliation.lastRun}
          </span>
          <button className="p-1 rounded text-secondary hover:text-on-surface" title="Reconciliation details">
            <Info size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {reconciliation.cards.map((card) => (
          <div key={card.id} className="p-space-lg rounded-xl bg-surface-container-low flex flex-col justify-between space-y-space-md">
            <div className="flex items-start justify-between">
              <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">{card.label}</span>
              {ICONS[card.id]}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-currency-hero text-currency-hero text-on-surface font-semibold">{card.count}</span>
                <span className="font-label-md text-label-md text-secondary">{card.unit}</span>
              </div>
              <p className={`font-currency-sm text-currency-sm mt-1 ${card.amountClass}`}>{card.amountText}</p>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">{card.detail}</p>
            </div>
            <Link className="font-label-md text-label-md text-primary font-semibold flex items-center gap-1 hover:underline" to={card.link.to}>
              <span>{card.link.label}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>
      <div className="p-space-md rounded-lg bg-surface-container/60 flex items-start gap-space-sm text-secondary">
        <ShieldCheck size={20} className="text-primary shrink-0" />
        <p className="font-body-sm text-body-sm leading-relaxed">
          <strong className="text-on-surface font-medium">Affordability Guardrail:</strong> Self-account transfers and identical transaction IDs are
          automatically flagged to ensure your <em>&quot;Can I Afford This?&quot;</em> affordability calculation stays strictly calibrated without
          double-counting your actual cash availability.
        </p>
      </div>
    </section>
  );
}
