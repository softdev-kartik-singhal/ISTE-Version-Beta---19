// Ask "What If" panel: toggle levers / custom offset and compare the upfront vs optimized outcome live.
import { useState } from 'react';
import { BadgeCheck, SlidersHorizontal } from 'lucide-react';
import LeverRow from './LeverRow';
import { formatCurrency } from '../../utils/formatCurrency';

export default function WhatIfPanel({ whatIf }) {
  const [enabled, setEnabled] = useState(() => Object.fromEntries(whatIf.levers.map((l) => [l.id, true])));
  const [custom, setCustom] = useState('');

  const leverSavings = whatIf.levers.reduce((sum, l) => sum + (enabled[l.id] ? l.saving : 0), 0);
  const optimizedSurplus = whatIf.baseSurplus + leverSavings + (parseFloat(custom) || 0);
  const { upfront, optimized } = whatIf;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-xs">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-primary" />
            <h3 className="font-headline-md text-headline-md text-on-surface">&apos;What If&apos; Optimization Panel — Dynamic Levers</h3>
          </div>
          <p className="font-body-md text-body-md text-secondary">
            Toggle discretionary subscriptions or simulate EMI conversions to see real-time impact on the Typical case surplus.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-md text-label-md font-semibold">Live Recalculation Active</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <div className="lg:col-span-6 space-y-space-md">
          <div className="font-label-md text-label-md text-secondary uppercase tracking-wider font-semibold">Actionable Optimization Levers</div>
          {whatIf.levers.map((lever) => (
            <LeverRow
              key={lever.id}
              lever={lever}
              checked={enabled[lever.id]}
              onChange={(on) => setEnabled({ ...enabled, [lever.id]: on })}
            />
          ))}
          <div className="p-space-md rounded-xl bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-body-md text-body-md font-semibold text-on-surface" htmlFor="customAdjustment">
                Add custom expense / inflow offset
              </label>
              <span className="font-label-sm text-label-sm text-secondary">e.g. Sell old phone</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-currency-md text-secondary text-sm">₹</span>
              <input
                className="w-full h-10 pl-8 pr-4 bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                id="customAdjustment"
                placeholder="15000 (old phone resale exchange)"
                type="number"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 flex flex-col justify-between space-y-space-md">
          <div className="font-label-md text-label-md text-secondary uppercase tracking-wider font-semibold">Outcome Comparison: Upfront vs Optimized</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md h-full">
            {/* Scenario A: Original Upfront */}
            <div className="bg-surface rounded-xl p-space-md flex flex-col justify-between space-y-space-md">
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-semibold text-secondary">Original Upfront</span>
                  <span className="px-2 py-0.5 rounded text-amber-900 bg-amber-100 font-label-sm text-label-sm">Tight Cushion</span>
                </div>
                <div className="space-y-2 pt-2 text-secondary font-body-sm text-body-sm">
                  <div className="flex justify-between">
                    <span>Upfront Outflow:</span>
                    <span className="font-currency-sm font-semibold text-on-surface">{formatCurrency(upfront.outflow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Subs:</span>
                    <span className="font-currency-sm text-on-surface">{formatCurrency(upfront.subscriptions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety Buffer intact:</span>
                    <span className="font-currency-sm text-emerald-800">{formatCurrency(upfront.buffer)}</span>
                  </div>
                </div>
              </div>
              <div className="pt-space-md bg-surface-container-lowest p-3 rounded-lg space-y-1">
                <div className="font-label-sm text-label-sm text-secondary">Typical Case Surplus</div>
                <div className="font-currency-md text-currency-md text-on-surface font-bold">{formatCurrency(whatIf.baseSurplus, { sign: true })} CR</div>
                <div className="font-label-sm text-label-sm text-amber-800 font-medium">Vulnerable to delayed invoice</div>
              </div>
            </div>
            {/* Scenario B: Optimized */}
            <div className="bg-emerald-50/60 rounded-xl p-space-md flex flex-col justify-between space-y-space-md shadow-sm relative overflow-hidden">
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-bold text-emerald-900">Optimized Dynamic</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-label-sm text-label-sm font-semibold flex items-center gap-1">
                    <BadgeCheck size={13} />
                    <span>High Confidence</span>
                  </span>
                </div>
                <div className="space-y-2 pt-2 text-secondary font-body-sm text-body-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface">Discretionary Subs:</span>
                    <span className="font-currency-sm font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {formatCurrency(optimized.subsSaved, { sign: true })} saved
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface">Upfront Nov Outflow:</span>
                    <span className="font-currency-sm font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {formatCurrency(optimized.emiOutflow)} EMI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety Buffer intact:</span>
                    <span className="font-currency-sm text-emerald-800 font-semibold">100% ({formatCurrency(upfront.buffer)})</span>
                  </div>
                </div>
              </div>
              <div className="pt-space-md bg-surface-container-lowest p-3 rounded-lg space-y-1 shadow-sm">
                <div className="font-label-sm text-label-sm text-emerald-900 font-semibold flex items-center justify-between">
                  <span>New Typical Surplus</span>
                  <span className="text-emerald-800 font-bold">{optimized.improvement}</span>
                </div>
                <div className="font-currency-hero text-currency-md text-emerald-800 font-extrabold tracking-tight">
                  {formatCurrency(optimizedSurplus, { sign: true })} CR
                </div>
                <div className="font-label-sm text-label-sm text-emerald-800 font-medium">Upgraded to High Confidence Verdict</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
