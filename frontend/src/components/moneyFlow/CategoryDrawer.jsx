// Money Flow side drawer for the selected category: totals, change drivers, concentration and 6-month trajectory.
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, Lightbulb, X } from 'lucide-react';
import TrajectoryBars from '../charts/TrajectoryBars';
import { formatCurrency } from '../../utils/formatCurrency';

const CONCENTRATION_COLORS = ['bg-amber-600', 'bg-amber-400', 'bg-amber-200'];

export default function CategoryDrawer({ detail, onClose }) {
  return (
    <div className="xl:col-span-4 2xl:col-span-4 flex flex-col gap-space-md">
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container p-space-md flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-500 shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{detail.name}</h2>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-label-sm text-[10px] font-bold">Category</span>
              </div>
              <span className="font-label-sm text-label-sm text-outline">Connected: {detail.connected}</span>
            </div>
          </div>
          <button className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors" type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <span className="font-currency-hero text-currency-hero text-on-surface font-bold tracking-tight">{formatCurrency(detail.amount)}</span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-label-md text-label-md font-semibold">
              <ArrowUp size={14} /> {detail.change}
            </span>
          </div>
          <div className="flex items-center justify-between font-label-md text-label-md text-on-surface-variant">
            <span>{detail.share}</span>
            <span className="font-currency-sm text-[12px] text-outline">3-Mo Median: {formatCurrency(detail.median)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">What Drove The Change</span>
            <span className="font-label-sm text-label-sm text-primary">{detail.compareLabel}</span>
          </div>
          <div className="flex flex-col gap-2">
            {detail.drivers.map((d, i) => (
              <div key={d.name} className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold text-xs">{i + 1}</div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-currency-sm text-currency-sm ${d.amountClass}`}>{formatCurrency(d.delta, { sign: true })}</span>
                    <span className={`px-1.5 py-0.2 rounded font-label-sm text-[10px] ${d.tagClass}`}>{d.tag}</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] pl-8">{d.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 border-t border-surface-container">
          <div className="flex items-center justify-between font-label-sm text-label-sm">
            <span className="uppercase tracking-wider text-outline font-semibold">Concentration Analysis</span>
            <span className="text-amber-800 font-semibold">{detail.concentration.summary}</span>
          </div>
          <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
            {detail.concentration.parts.map((p, i) => (
              <div
                key={p.name}
                className={`h-full ${CONCENTRATION_COLORS[i]} hover:opacity-90 transition-opacity`}
                style={{ width: `${p.percent}%` }}
                title={`${p.name} ${p.percent}%`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] font-currency-sm text-on-surface-variant px-1">
            {detail.concentration.parts.map((p, i) => (
              <span key={p.name} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${CONCENTRATION_COLORS[i]}`} /> {p.name} {p.percent}%
              </span>
            ))}
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface text-[12px] flex items-start gap-2 mt-1">
            <Lightbulb size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <span>{detail.concentration.tip}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 border-t border-surface-container">
          <div className="flex items-center justify-between font-label-sm text-label-sm">
            <span className="uppercase tracking-wider text-outline font-semibold">6-Month Trajectory</span>
            <span className="font-currency-sm text-outline">{detail.trajectory.range}</span>
          </div>
          <div className="pt-3 h-24">
            <TrajectoryBars months={detail.trajectory.months} />
          </div>
        </div>

        <Link
          className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold font-label-md text-label-md transition-colors text-center shadow-sm"
          to="/transactions"
        >
          <span>
            View all {detail.transactionCount} transactions in {detail.shortName}
          </span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
