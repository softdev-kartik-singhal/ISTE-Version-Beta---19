// Dashboard screen: affordability box, key metrics, upcoming payments, insights, charts and flags.
import { useApi } from '../hooks/useApi';
import { getDashboard } from '../services/api';
import AffordabilityHero from '../components/dashboard/AffordabilityHero';
import LiquidityCards from '../components/dashboard/LiquidityCards';
import UpcomingPayments from '../components/dashboard/UpcomingPayments';
import ChangeInsightCard from '../components/dashboard/ChangeInsightCard';
import ProjectionCard from '../components/dashboard/ProjectionCard';
import IncomeSpendingCard from '../components/dashboard/IncomeSpendingCard';
import SpendingBreakdownCard from '../components/dashboard/SpendingBreakdownCard';
import AttentionList from '../components/dashboard/AttentionList';

export default function Dashboard() {
  const data = useApi(getDashboard);
  if (!data) return null;

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="max-w-[1440px] mx-auto p-space-xl">
        <div className="flex flex-col w-full space-y-space-lg">
          <AffordabilityHero defaultQuestion={data.defaultQuestion} quickQuestions={data.quickQuestions} />
          <LiquidityCards liquidity={data.liquidity} />
          <UpcomingPayments payments={data.upcoming} />

          {/* What changed this month */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">What changed this month</h3>
              <span className="font-label-sm text-label-sm text-secondary">Analyzed from {data.analyzedTransactions} transactions</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              {data.changes.map((insight) => (
                <ChangeInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>

          {/* Visual analysis & flags */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            <div className="lg:col-span-7 flex flex-col gap-space-lg">
              <ProjectionCard projection={data.projection} />
              <IncomeSpendingCard data={data.incomeVsSpending} />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-space-lg">
              <SpendingBreakdownCard spending={data.spending} />
              <AttentionList attention={data.attention} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
