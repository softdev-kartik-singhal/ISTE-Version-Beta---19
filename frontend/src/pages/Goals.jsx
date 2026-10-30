// Goals screen: portfolio KPIs, goal cards with feasibility, and the "New Goal" dialog.
import { useState } from 'react';
import { Plus, Share, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getGoals } from '../services/api';
import GoalSummaryCards from '../components/goals/GoalSummaryCards';
import GoalCard from '../components/goals/GoalCard';
import GoalDialog from '../components/dialogs/GoalDialog';
import { formatCurrency } from '../utils/formatCurrency';

export default function Goals() {
  const data = useApi(getGoals);
  const [dialogOpen, setDialogOpen] = useState(false);
  if (!data) return null;

  return (
    <main className="w-full pt-16 px-space-lg py-space-lg flex-1 bg-background">
      <div className="flex flex-col w-full pb-space-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
              <span>Capital Planning</span>
              <span>•</span>
              <span className="text-primary font-semibold">Deterministic Surplus Model</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Financial Goals</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 leading-relaxed">
              Targeted capital allocation calculated against your real liquid monthly surplus{' '}
              <span className="font-currency-sm text-currency-sm font-semibold text-on-surface">({formatCurrency(data.surplus.average)} avg</span> /{' '}
              <span className="font-currency-sm text-currency-sm text-on-surface-variant">{formatCurrency(data.surplus.floor)} conservative floor)</span>.
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <button className="px-4 py-2 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-lg shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-1.5 cursor-pointer">
              <Share size={18} className="text-on-surface-variant" />
              <span>Export Goals</span>
            </button>
            <button
              className="px-4 py-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary transition-all flex items-center gap-1.5 cursor-pointer"
              onClick={() => setDialogOpen(true)}
            >
              <Plus size={18} />
              <span>New Goal</span>
            </button>
          </div>
        </div>

        <GoalSummaryCards summary={data.summary} />

        <div className="flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Capital Milestones</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
              {data.goals.length} Scheduled
            </span>
          </div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
            <SlidersHorizontal size={16} className="text-primary" />
            <span>Ranked by strict chronological maturity</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg mb-space-xl">
          {data.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={() => setDialogOpen(true)} />
          ))}
        </div>

        <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
              <ShieldCheck size={18} />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
              <strong className="font-semibold text-on-surface">Deterministic Engine Integrity:</strong> Goal feasibility evaluations run directly
              against verified multi-account aggregates (HDFC, ICICI, Kotak). Internal bank transfers and credit sweeps are mathematically excluded
              from surplus computations.
            </p>
          </div>
          <span className="hidden sm:inline-flex font-label-sm text-label-sm text-outline shrink-0">Revision ID: {data.revisionId}</span>
        </div>

        <GoalDialog open={dialogOpen} onClose={() => setDialogOpen(false)} draft={data.draft} classifications={data.classifications} />
      </div>
    </main>
  );
}
