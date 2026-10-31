// "Self-Calibrating Engine" section: accuracy before/after user corrections and top merchant overrides.
import { ArrowRight, ShoppingBasket } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';

const RULE_ICONS = { basket: ShoppingBasket };

export default function LearningLoop({ learning }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-xl shadow-sm space-y-space-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">Learning From Your Corrections</span>
          <h3 className="font-headline-md text-headline-md text-on-surface mt-1">What the categoriser has learned from you</h3>
          <p className="font-body-sm text-body-sm text-secondary">Fixing one transaction fixes every transaction of that merchant, now and in future uploads</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-primary font-currency-sm text-currency-sm font-semibold">
          <span>{learning.corrections} corrections</span>
          <ArrowRight size={18} />
          <span>{learning.merchantsRemembered} merchants remembered</span>
        </div>
      </div>
      <div className="space-y-space-sm bg-surface-container-low p-space-lg rounded-xl">
        {learning.baseline != null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-on-surface font-label-md text-label-md">
              <span className="text-secondary">Categorisation accuracy before and after corrections (demo statements)</span>
              <span className="text-primary font-semibold">+{Math.round(learning.tuned - learning.baseline)}% lift</span>
            </div>
            <div>
              <div className="flex justify-between text-body-sm font-body-sm text-secondary mb-1">
                <span>Keyword rules only</span>
                <span className="font-currency-sm">{learning.baseline.toFixed(1)}%</span>
              </div>
              <ProgressBar percent={learning.baseline} barClass="bg-secondary" heightClass="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-body-sm font-body-sm text-on-surface font-medium mb-1">
                <span>After merchant corrections</span>
                <span className="font-currency-sm font-semibold text-primary">{learning.tuned.toFixed(1)}%</span>
              </div>
              <ProgressBar percent={learning.tuned} barClass="bg-primary-container" heightClass="h-3" />
            </div>
          </div>
        )}
        <p className="font-body-sm text-body-sm text-secondary mt-space-sm leading-relaxed">{learning.note}</p>
      </div>
      <div className="space-y-space-sm">
        {learning.overrides.length > 0 && <h4 className="font-headline-sm text-headline-sm text-on-surface">Corrections that helped most</h4>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {learning.overrides.map((rule) => {
            const Icon = RULE_ICONS[rule.icon];
            return (
              <div key={rule.merchant} className="p-space-md rounded-lg bg-surface-container-low/70 flex items-start justify-between gap-space-sm">
                <div className="space-y-1">
                  <span className="font-headline-sm text-headline-sm text-on-surface block">{rule.merchant}</span>
                  <span className="font-body-sm text-body-sm text-secondary block">{rule.rule}</span>
                  <span className="font-label-sm text-label-sm text-primary font-medium inline-block mt-1">{rule.status}</span>
                </div>
                <Icon size={20} className="text-primary" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
