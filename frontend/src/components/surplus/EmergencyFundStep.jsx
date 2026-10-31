// Surplus Plan Step 1: emergency fund target, "How calculated" breakdown, progress milestones and ETA.
import { CalendarDays, ChevronDown, Hourglass, SlidersHorizontal } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function EmergencyFundStep({ fund, showBreakdown, onToggleBreakdown }) {
  const percent = Math.round((fund.saved / fund.target) * 100);

  return (
    <section id="emergency-fund" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="px-2.5 py-1 rounded-full bg-primary-container text-surface-container-lowest font-label-md text-label-md uppercase tracking-wider">Step 1</span>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Emergency fund first: Build your baseline liquidity buffer</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span className="font-label-sm text-label-sm font-semibold text-primary uppercase">Priority Allocation Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
        <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Target Liquidity Floor</span>
              <button
                className="font-label-sm text-label-sm text-primary flex items-center gap-1 hover:underline focus:outline-none"
                onClick={onToggleBreakdown}
              >
                <SlidersHorizontal size={15} />
                <span>How calculated</span>
                <ChevronDown size={14} className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-currency-hero text-currency-hero text-on-surface font-semibold tracking-tight">{formatCurrency(fund.target)}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">({fund.bufferMonths} months essential buffer)</span>
            </div>
          </div>

          {showBreakdown && (
            <div className="flex flex-col gap-2 p-3 bg-surface-container-lowest rounded-lg shadow-sm">
              <p className="font-label-sm text-label-sm font-semibold text-on-surface uppercase mb-1">Trailing Essential Outflows</p>
              {fund.essentials.map((e) => (
                <div key={e.name} className="flex justify-between font-body-sm text-body-sm text-on-surface-variant py-0.5">
                  <span>{e.name}</span>
                  <span className="font-currency-sm text-currency-sm font-medium text-on-surface">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 bg-surface-container-low px-2 py-1.5 rounded flex justify-between font-body-sm text-body-sm text-on-surface">
                <span className="font-medium">Total monthly baseline:</span>
                <span className="font-currency-sm text-currency-sm font-bold text-primary">{formatCurrency(fund.monthlyBaseline)} / mo</span>
              </div>
              <p className="font-label-sm text-[10px] text-on-surface-variant italic mt-1 leading-snug">
                *Calibrated at {formatCurrency(fund.monthlyBaseline)}/mo essential baseline scaled with safety coefficients for irregular freelance
                receipts = {formatCurrency(fund.target)} target floor.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-secondary-fixed flex items-center justify-center text-primary">
                <Hourglass size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Current Safe Runway</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{fund.runway}</span>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-surface-container-high text-on-secondary-container font-label-sm text-label-sm font-medium">Safe Margin</span>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl">
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-end justify-between">
              <div>
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Buffer Fulfilled</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-currency-hero text-currency-hero text-on-surface font-semibold">{formatCurrency(fund.saved)}</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">saved</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-currency-md text-currency-md font-bold text-primary">{percent}%</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">of {formatCurrency(fund.target)}</span>
              </div>
            </div>
            <div className="relative w-full pt-4 pb-2">
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex">
                <div className="h-full bg-primary-container transition-all duration-700 rounded-full" style={{ width: `${percent}%` }} />
              </div>
              <div className="relative w-full flex justify-between mt-2 font-label-sm text-label-sm text-on-surface-variant">
                {fund.milestones.map((m, i) => {
                  const align = i === 0 ? 'items-start' : i === fund.milestones.length - 1 ? 'items-end' : 'items-center';
                  return (
                    <div key={m.label} className={`flex flex-col ${align}`}>
                      <span className={`font-currency-sm text-[11px] ${m.next ? 'text-primary' : 'text-on-surface'} ${i > 0 ? 'font-semibold' : ''}`}>
                        {formatCurrency(m.amount)}
                      </span>
                      <span className="text-[10px]">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-surface-container-high rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-sm">
              <CalendarDays size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Forward Velocity Projection</span>
              <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                At your average surplus of{' '}
                <span className="font-currency-sm text-currency-sm font-semibold text-primary">{formatCurrency(fund.averageSurplus)}</span>, you will
                bridge the remaining {formatCurrency(fund.target - fund.saved)} in approximately{' '}
                <strong className="font-semibold text-on-surface">{fund.etaRange}</strong> (projected completion:{' '}
                <strong className="font-semibold text-on-surface">{fund.completion}</strong>).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
