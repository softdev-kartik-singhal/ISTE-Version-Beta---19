// Surplus Plan, "The Runway": one story on a timeline of months, in five chapters.
//   01 emergency fund first (Step 1)  02 if your income suddenly stopped  03 put the extra to work (Step 2)
//   04 split your monthly surplus (Step 3)  05 suggestions for you
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Info, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { downloadCsv } from '../utils/download';
import { formatCurrency } from '../utils/formatCurrency';
import Toast from '../components/ui/Toast';
import { getSurplusPlan } from '../services/api';
import PageState from '../components/ui/PageState';
import RunwayNav from '../components/runway/RunwayNav';
import EmergencyChapter from '../components/runway/EmergencyChapter';
import IncomeStopChapter from '../components/runway/IncomeStopChapter';
import WaysChapter from '../components/runway/WaysChapter';
import SplitChapter from '../components/runway/SplitChapter';
import SuggestionsChapter from '../components/runway/SuggestionsChapter';
import StewardshipFooter from '../components/surplus/StewardshipFooter';
import '../components/runway/runway.css';

const COMMIT_KEY = 'sg_surplus_commit';
const nextMonthName = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

function readCommit() {
  try {
    return JSON.parse(localStorage.getItem(COMMIT_KEY) || 'null');
  } catch {
    return null;
  }
}
function writeCommit(value) {
  try {
    if (value) localStorage.setItem(COMMIT_KEY, JSON.stringify(value)); else localStorage.removeItem(COMMIT_KEY);
  } catch {
    /* storage unavailable: the commitment lasts until the page is closed */
  }
}

export default function SurplusPlan() {
  const api = useApi(getSurplusPlan);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [committed, setCommitted] = useState(readCommit); // remembered on this device
  const [toast, showToast] = useToast();
  if (!api.ready) return <PageState state={api} />;
  const data = api.data;

  function exportPlan(plan) {
    downloadCsv(`smartgullak-allocation-plan-${new Date().toLocaleDateString('en-CA')}.csv`, [
      { bucket: 'Emergency Buffer', percent: plan.emergencyPct, monthly: plan.emergencyAmt, per_year: plan.emergencyAmt * 12, note: `ETA to target: ${plan.eta}` },
      { bucket: 'Long-term Goals', percent: plan.goalsPct, monthly: plan.goalsAmt, per_year: plan.goalsAmt * 12, note: `${plan.goalsAmt * 12} per year` },
    ]);
    showToast('Allocation plan exported as CSV');
  }

  // Commit remembers this user's split for next month; pressing it again with the same split removes it.
  function commit(plan) {
    if (committed && committed.emergencyPct === plan.emergencyPct) {
      writeCommit(null);
      setCommitted(null);
      showToast('Commitment removed');
      return;
    }
    const value = { emergencyPct: plan.emergencyPct, emergencyAmt: plan.emergencyAmt, goalsAmt: plan.goalsAmt, month: nextMonthName() };
    writeCommit(value);
    setCommitted(value);
    showToast(`Next month: ${formatCurrency(plan.emergencyAmt)} to emergency buffer, ${formatCurrency(plan.goalsAmt)} to goals`);
  }

  function showMethodology() {
    setShowBreakdown(true);
    document.getElementById('emergency-fund').scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="runway-page relative min-h-screen pt-16 pb-24 font-['Inter',system-ui,sans-serif] lg:pb-10">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 py-8 sm:py-10 md:flex-row md:items-end">
          <div>
            <p className="mb-2 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[#1d4ed8]">Capital Architecture</span>
              <span className="font-semibold text-slate-600">| {data.fiscalYear}</span>
            </p>
            <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#0b2545] sm:text-[52px]">Surplus Plan</h1>
            <p className="mt-3 max-w-2xl text-[16px] text-slate-600">Deterministic framework to allocate liquid monthly cashflow into safety buffers and long-term milestones.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1d4ed8]"><ShieldCheck size={19} aria-hidden="true" /></span>
            <span>
              <span className="block text-[12px] font-semibold uppercase tracking-wide text-slate-500">Framework Mode</span>
              <span className="block text-[15px] font-semibold text-[#0b2545]">{data.frameworkMode}</span>
            </span>
          </div>
        </header>

        <RunwayNav />

        <EmergencyChapter fund={data.emergencyFund} showBreakdown={showBreakdown} onToggleBreakdown={() => setShowBreakdown(!showBreakdown)} />
        <IncomeStopChapter />
        <WaysChapter />
        <SplitChapter allocation={data.allocation} committed={committed} onExport={exportPlan} onCommit={commit} />
        <SuggestionsChapter />

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
          <Info size={20} className="mt-0.5 shrink-0 text-[#1d4ed8]" aria-hidden="true" />
          <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row md:items-center">
            <p className="text-[14px] leading-relaxed text-slate-600">
              <strong className="font-semibold text-slate-900">Educational guidance based on your own numbers</strong> — not investment advice. SmartGullak does not recommend specific mutual fund schemes, stocks, or financial products.
            </p>
            <Link to="/privacy" className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-[#1d4ed8] hover:underline">Compliance Charter <ExternalLink size={14} aria-hidden="true" /></Link>
          </div>
        </div>
        <StewardshipFooter onMethodology={showMethodology} />
      </div>
      <Toast message={toast} />
    </main>
  );
}
