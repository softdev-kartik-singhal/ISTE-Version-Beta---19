// Home hero: greeting, one plain sentence with a status pill, the "Can I afford…?" box, a stale-data line,
// and the spending ring on the right (stacked under the text on small screens).
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import StatusPill, { STATUS } from './StatusPill';
import SpentRing from './SpentRing';
import AskInline from './AskInline';
import { rounded } from '../../utils/money';

function greeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const first = (name || '').trim().split(/\s+/)[0];
  return first ? `${part}, ${first}` : part;
}

const STALE_AFTER_DAYS = 7;

export default function HomeHero({ name, hero }) {
  const stale = (Date.now() - new Date(`${hero.asOfIso}T00:00:00`)) / 864e5 > STALE_AFTER_DAYS;
  return (
    <section className="home-hero home-in relative overflow-hidden rounded-[20px] text-white shadow-xl">
      <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-8 items-center p-6 sm:p-8 lg:p-10">
        <div className="space-y-5 min-w-0">
          <div className="space-y-3">
            <p className="text-[15px] text-blue-100">{greeting(name)}</p>
            <h1 className="text-[24px] sm:text-[30px] font-bold leading-tight tracking-tight max-w-2xl">
              {STATUS[hero.status].lead} — {rounded(hero.moneyLeft)} left after bills in {hero.month}.
            </h1>
            <StatusPill status={hero.status} />
          </div>
          <AskInline example={hero.quickQuestions[1] || hero.defaultQuestion} chips={hero.quickQuestions.slice(0, 3)} />
          {stale && (
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-blue-100">
              <CalendarClock size={15} aria-hidden="true" /> Statements end {hero.asOf}{hero.ageDays > 7 ? ` (${hero.ageDays} days ago, so these numbers are as of then)` : ''}.
              <Link to="/statements" className="font-semibold text-white underline underline-offset-2 hover:no-underline">Upload {hero.uploadMonth}</Link>
            </p>
          )}
        </div>
        <div className="justify-self-center">
          <SpentRing spentPct={hero.spentPct} moneyLeft={hero.moneyLeft} daysLeft={hero.daysLeft} spent={hero.spent} usualSpend={hero.usualSpend} />
        </div>
      </div>
    </section>
  );
}
