// Landing "sample decision waterfall": purchase slider, live verdict, waterfall steps and scenario bars.
import { useState } from 'react';
import { Network, Nfc, ShieldCheck, SlidersHorizontal, Terminal } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { simulate } from '../../utils/landingVerdict';

export default function AffordabilitySimulator({ sim }) {
  const [amount, setAmount] = useState(sim.defaultAmount);
  const { residual, verdict, scenarios } = simulate(sim, amount);

  const steps = [
    { n: 1, title: 'Base Net Income Projection', detail: 'Salaried (₹1.80L) + P50 Freelance Retainers (₹65k)', value: sim.income, positive: true },
    { n: 2, title: 'Committed Non-Negotiables', detail: 'Home EMI, SIP Mutual Funds, Term Health Cover', value: -sim.committed },
    { n: 3, title: 'Baseline Living & Floating UPI Spend', detail: 'Calibrated from 90 days trailing transaction medians', value: -sim.baseline },
    { n: 4, title: 'Statutory Safe Emergency Floor', detail: 'Untouchable liquid capital rule enforced by system', value: -sim.safetyFloor },
  ];

  return (
    <section className="px-6 lg:px-12 -mt-4 pb-space-2xl bg-surface scroll-mt-20" id="waterfall-demo">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-xl bg-surface-container-lowest shadow-xl overflow-hidden">
          <div className="px-6 py-3.5 bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-outline-variant inline-block" />
                <span className="w-3 h-3 rounded-full bg-outline-variant inline-block" />
                <span className="w-3 h-3 rounded-full bg-outline-variant inline-block" />
              </div>
              <div className="h-4 w-px bg-outline-variant/40" />
              <div className="flex items-center gap-space-xs text-on-surface-variant">
                <Terminal size={16} />
                <span className="font-currency-sm text-currency-sm font-mono text-xs">local_vault_instance://v4.2.production</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="px-2.5 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 3 Bank Feeds Synced
              </span>
              <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Updated 8 mins ago</span>
            </div>
          </div>

          <div className="p-6 lg:p-10 space-y-8 bg-surface-container-lowest">
            <div className="p-6 rounded-xl bg-surface-container-low space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Active Capital Inquest</span>
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                    Can I afford an <span className="font-currency-md text-currency-md text-primary-container">{formatCurrency(amount)}</span> phone next month?
                  </h3>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant">Adjust Purchase Size:</span>
                  <input
                    className="accent-primary cursor-pointer w-32 sm:w-44 h-2 bg-surface-container-high rounded-lg appearance-none"
                    max={sim.max}
                    min={sim.min}
                    step={sim.step}
                    type="range"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="p-5 rounded-lg bg-surface-container flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-space-md">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-space-sm">
                      <span className={`font-headline-sm text-headline-sm font-semibold ${verdict.titleClass}`}>{verdict.title}</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-bold">VERDICT 09-B</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{verdict.detail}</p>
                  </div>
                </div>
                <div className="w-full md:w-56 shrink-0 bg-surface-container-lowest p-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Confidence Rating</span>
                    <span className="font-label-md text-label-md font-bold text-primary">{verdict.confidenceLabel}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full transition-all duration-300" style={{ width: `${verdict.confidence}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-space-sm">
                    <Network size={22} className="text-primary" /> Transparent Decision Waterfall
                  </h4>
                  <span className="font-label-sm text-label-sm text-secondary">30-Day Forward Forecast</span>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4 space-y-3">
                  {steps.map((s) => (
                    <div key={s.n} className="p-3.5 rounded-lg bg-surface-container-lowest flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-space-md">
                        <span
                          className={`w-6 h-6 rounded-full bg-surface-container ${s.positive ? 'text-primary' : 'text-secondary'} font-label-sm text-label-sm font-bold flex items-center justify-center`}
                        >
                          {s.n}
                        </span>
                        <div>
                          <p className="font-body-md text-body-md font-medium text-on-surface">{s.title}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{s.detail}</p>
                        </div>
                      </div>
                      <span
                        className={`font-currency-md text-currency-md ${s.positive ? 'text-primary font-semibold' : 'text-on-surface-variant font-medium'}`}
                      >
                        {formatCurrency(s.value, { sign: true })}
                      </span>
                    </div>
                  ))}
                  <div className="p-4 rounded-lg bg-surface-container-high flex items-center justify-between">
                    <div>
                      <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Unencumbered Discretionary Capital</span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Post-purchase balance remaining in liquid accounts</p>
                    </div>
                    <span className={`font-currency-md text-currency-md font-semibold ${residual >= 0 ? 'text-primary' : 'text-error'}`}>
                      {formatCurrency(residual, { sign: true })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-space-sm">
                  <SlidersHorizontal size={22} className="text-primary" /> Scenario Simulation
                </h4>
                <div className="rounded-xl bg-surface-container-low p-5 space-y-4">
                  {scenarios.map((s) => (
                    <div key={s.label} className="space-y-3">
                      <div className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface font-medium">{s.label}</span>
                        <span className={`font-currency-sm text-currency-sm font-semibold ${s.value < 0 ? 'text-error' : 'text-primary'}`}>
                          {formatCurrency(s.value, { sign: true })} ({s.tag})
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                        <div className={`${s.barClass} h-full rounded-full transition-all duration-300`} style={{ width: `${s.width}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-surface-container-high/60">
                    <div className="flex items-center gap-space-sm p-3 rounded-lg bg-surface-container-lowest text-on-surface-variant">
                      <Nfc size={20} className="text-primary" />
                      <span className="font-label-sm text-label-sm leading-relaxed">
                        Physical Card Key <strong>{sim.cardKey}</strong> bound. Simulation operates strictly in-memory.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
