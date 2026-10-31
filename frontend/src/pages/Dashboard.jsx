// Home ("How am I doing?"): money left this month, Ask, what is coming up, one tip, things to check,
// this month vs usual and the month-end range. The detailed dashboard stays one tap away under "Show how".
import { Link, useOutletContext } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getHome } from '../services/api';
import { greeting } from '../utils/greeting';
import PageState from '../components/ui/PageState';
import ShowHow from '../components/ui/ShowHow';
import MoneyLeftHero from '../components/home/MoneyLeftHero';
import AskBox from '../components/home/AskBox';
import ComingUp from '../components/home/ComingUp';
import TipCard from '../components/home/TipCard';
import CategoryBars from '../components/home/CategoryBars';
import MonthEndCard from '../components/home/MonthEndCard';
import StaleDataBanner from '../components/dashboard/StaleDataBanner';
import LiquidityCards from '../components/dashboard/LiquidityCards';
import UpcomingPayments from '../components/dashboard/UpcomingPayments';
import ChangeInsightCard from '../components/dashboard/ChangeInsightCard';
import ProjectionCard from '../components/dashboard/ProjectionCard';
import IncomeSpendingCard from '../components/dashboard/IncomeSpendingCard';
import SpendingBreakdownCard from '../components/dashboard/SpendingBreakdownCard';
import AttentionList from '../components/dashboard/AttentionList';

export default function Dashboard() {
  const { session } = useOutletContext();
  const api = useApi(getHome);
  if (!api.ready) return <PageState state={api} />;
  const { home, detail } = api.data;

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="max-w-5xl mx-auto p-space-md lg:p-space-xl space-y-space-lg">
        <MoneyLeftHero greeting={greeting(session?.user.name)} moneyLeft={home.moneyLeft} daysLeft={home.daysLeft} status={home.status} />
        <StaleDataBanner asOf={home.asOf} />
        <AskBox example={detail.quickQuestions[1] || detail.defaultQuestion} />
        <ComingUp payments={home.comingUp} />
        <TipCard tip={home.tip} />
        {home.openFlags > 0 && (
          <Link
            to="/flags"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-md text-label-md font-semibold hover:underline"
          >
            <ListChecks size={16} /> Things to check ({home.openFlags})
          </Link>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-space-lg items-start">
          <div className="lg:col-span-3">
            <CategoryBars bars={home.bars} month={home.barsMonth} />
          </div>
          <div className="lg:col-span-2">
            <MonthEndCard range={home.monthEndRange} />
          </div>
        </div>

        <ShowHow>
          <LiquidityCards liquidity={detail.liquidity} />
          <ProjectionCard projection={detail.projection} />
          <UpcomingPayments payments={detail.upcoming} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {detail.changes.map((insight) => (
              <ChangeInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            <IncomeSpendingCard data={detail.incomeVsSpending} />
            <SpendingBreakdownCard spending={detail.spending} />
          </div>
          <AttentionList attention={detail.attention} />
        </ShowHow>
      </div>
    </main>
  );
}
