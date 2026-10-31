// Home: hero (status, money left, Can I afford…?), key numbers, coming up, cash and quick actions, what changed,
// where the money went, the 8-week balance forecast, the 6-month trend and things to check.
import { useOutletContext } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getHome } from '../services/api';
import PageState from '../components/ui/PageState';
import HomeSkeleton from '../components/home/HomeSkeleton';
import HomeHero from '../components/home/HomeHero';
import KeyNumbers from '../components/home/KeyNumbers';
import ComingUp from '../components/home/ComingUp';
import CashAndActions from '../components/home/CashAndActions';
import WhatChanged from '../components/home/WhatChanged';
import WhereMoneyWent from '../components/home/WhereMoneyWent';
import BalanceForecast from '../components/home/BalanceForecast';
import MonthlyTrend from '../components/home/MonthlyTrend';
import ThingsToCheck from '../components/home/ThingsToCheck';
import '../components/home/home.css';

const PAGE = 'relative pt-16 min-h-screen bg-[#f5f7fb]';
const WRAP = 'max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5 sm:space-y-6';

export default function Dashboard() {
  const { session } = useOutletContext();
  const api = useApi(getHome);
  if (api.status === 'loading') {
    return <main className={PAGE}><div className={WRAP}><HomeSkeleton /></div></main>;
  }
  if (!api.ready) return <PageState state={api} />;
  const h = api.data;

  return (
    <main className={`${PAGE} font-['Inter',system-ui,sans-serif]`}>
      <div className={WRAP}>
        <HomeHero name={session?.user.name} hero={h.hero} />
        <KeyNumbers keys={h.keys} />
        <ComingUp items={h.comingUp} />
        <CashAndActions />
        <WhatChanged changes={h.changes} month={h.hero.month} />
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          <WhereMoneyWent spending={h.spending} />
          <BalanceForecast forecast={h.forecast} />
        </div>
        <MonthlyTrend trend={h.trend} />
        <ThingsToCheck checks={h.checks} openCount={h.openFlags} />
      </div>
    </main>
  );
}
