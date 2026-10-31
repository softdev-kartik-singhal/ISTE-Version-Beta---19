// Trends & Surplus screen: summary cards, monthly cashflow chart, category variances and intelligence panel.
import { useState } from 'react';
import { Gauge, Info } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { getTrends } from '../services/api';
import { downloadCsv } from '../utils/download';
import PageState from '../components/ui/PageState';
import TrendsHeader from '../components/trends/TrendsHeader';
import TrendSummaryCards from '../components/trends/TrendSummaryCards';
import CashflowTrendCard from '../components/trends/CashflowTrendCard';
import CategoryTrendsTable from '../components/trends/CategoryTrendsTable';
import IntelligencePanel from '../components/trends/IntelligencePanel';
import Toast from '../components/ui/Toast';

// The "Last 3 Months" option keeps only the most recent three months of data.
function cashflowFor(period, periods, cashflow) {
  if (period !== periods[1]) return cashflow;
  const months = cashflow.months.slice(-3);
  const totalInflow = months.reduce((s, m) => s + m.inflow, 0);
  const totalOutflow = months.reduce((s, m) => s + m.outflow, 0);
  return { months, totalInflow, totalOutflow, netSurplus: totalInflow - totalOutflow };
}

export default function Trends() {
  const api = useApi(getTrends);
  const [period, setPeriod] = useState(null);
  const [toast, showToast] = useToast();
  if (!api.ready) return <PageState state={api} />;
  const data = api.data;

  const selected = period || data.periods[0];
  const cashflow = cashflowFor(selected, data.periods, data.cashflow);

  function exportTrends() {
    downloadCsv('smartgullak-trends.csv', [
      ...cashflow.months.map((m) => ({ type: 'month', name: m.label, inflow: m.inflow, outflow: m.outflow, surplus: m.surplus })),
      ...data.categories.map((c) => ({ type: 'category', name: c.name, inflow: '', outflow: c.thisMonth, surplus: c.variance })),
    ]);
    showToast('Trends exported as CSV');
  }

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="flex flex-col w-full">
        <div className="px-space-xl py-space-lg space-y-space-lg max-w-[1440px] mx-auto w-full">
          <TrendsHeader periods={data.periods} period={selected} onPeriodChange={setPeriod} onExport={exportTrends} />
          <TrendSummaryCards summary={data.summary} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <div className="lg:col-span-8 space-y-space-lg">
              <CashflowTrendCard cashflow={cashflow} />
              <CategoryTrendsTable categories={data.categories} month={data.categoryMonth} />
            </div>
            <div className="lg:col-span-4 space-y-space-md">
              <IntelligencePanel findings={data.findings} />
              {/* Net surplus velocity */}
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Net Surplus Velocity</span>
                  <Gauge size={18} className="text-secondary" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-on-surface">{data.runway.months}</span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">Emergency Runway</span>
                </div>
                <p className="mt-2 font-body-sm text-body-sm text-secondary">{data.runway.detail}</p>
              </div>
            </div>
          </div>
          {/* Clean cashflow rule disclaimer */}
          <div className="p-space-md rounded-xl bg-surface-container-low text-secondary flex items-start sm:items-center gap-space-sm shadow-sm">
            <Info size={20} className="text-primary flex-shrink-0" />
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              <span className="font-semibold text-on-surface">Clean Cashflow Rule:</span> Transfers between your own verified accounts (
              <span className="font-mono text-[12px]">{data.ownAccounts.join(' ⇄ ')}</span>) are automatically identified and excluded from total
              income and spending tallies to prevent artificial ledger inflation.
            </p>
          </div>
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
