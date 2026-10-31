// Surplus Plan screen: emergency fund first, common options, and the monthly allocation simulator.
import { useState } from 'react';
import { ExternalLink, Info, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { downloadCsv } from '../utils/download';
import { formatCurrency } from '../utils/formatCurrency';
import Toast from '../components/ui/Toast';
import { getSurplusPlan } from '../services/api';
import PageState from '../components/ui/PageState';
import EmergencyFundStep from '../components/surplus/EmergencyFundStep';
import AllocationSimulator from '../components/surplus/AllocationSimulator';
import SuggestionsCard from '../components/surplus/SuggestionsCard';
import JobLossPlanner from '../components/surplus/JobLossPlanner';
import WaysToUseMoney from '../components/surplus/WaysToUseMoney';
import StewardshipFooter from '../components/surplus/StewardshipFooter';

export default function SurplusPlan() {
  const api = useApi(getSurplusPlan);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [toast, showToast] = useToast();
  if (!api.ready) return <PageState state={api} />;
  const data = api.data;

  function exportPlan(plan) {
    downloadCsv('smartgullak-allocation-plan.csv', [
      { bucket: 'Emergency Buffer', percent: plan.emergencyPct, monthly: plan.emergencyAmt, note: `ETA to target: ${plan.eta}` },
      { bucket: 'Long-term Goals', percent: plan.goalsPct, monthly: plan.goalsAmt, note: `${plan.goalsAmt * 12} per year` },
    ]);
    showToast('Allocation plan exported as CSV');
  }

  function commit(plan) {
    setCommitted(!committed);
    showToast(
      committed
        ? 'Commitment removed'
        : `Next month: ${formatCurrency(plan.emergencyAmt)} to emergency buffer, ${formatCurrency(plan.goalsAmt)} to goals`,
    );
  }

  function showMethodology() {
    setShowBreakdown(true);
    document.getElementById('emergency-fund').scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="w-full pt-16 px-space-lg py-space-lg flex-1 bg-background">
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-space-md mb-space-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                  Capital Architecture
                </span>
                <span className="font-currency-sm text-currency-sm text-on-surface-variant font-medium">| {data.fiscalYear}</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Surplus Plan</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Deterministic framework to allocate liquid monthly cashflow into safety buffers and long-term milestones.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Framework Mode</span>
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">{data.frameworkMode}</span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl text-on-surface shadow-sm">
            <Info size={20} className="text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 flex-1">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="font-semibold text-on-surface">Educational guidance based on your own numbers</strong> — not investment advice.
                SmartGullak does not recommend specific mutual fund schemes, stocks, or financial products.
              </p>
              <button
                className="font-label-sm text-label-sm text-primary font-medium shrink-0 flex items-center gap-1 cursor-pointer hover:underline"
                onClick={() => showToast('Compliance Charter: guidance only, no product recommendations, all maths runs on your own data')}
              >
                Compliance Charter <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-space-xl">
          <EmergencyFundStep fund={data.emergencyFund} showBreakdown={showBreakdown} onToggleBreakdown={() => setShowBreakdown(!showBreakdown)} />

          <JobLossPlanner />

          <section className="flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider">Step 2</span>
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                Once your emergency fund is ready, common options people consider
              </h2>
            </div>
            <WaysToUseMoney />
          </section>

          <AllocationSimulator allocation={data.allocation} committed={committed} onExport={exportPlan} onCommit={commit} />
          <SuggestionsCard />
          <p className="font-label-sm text-label-sm text-on-surface-variant">{data.disclaimer}</p>
          <StewardshipFooter onMethodology={showMethodology} />
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
