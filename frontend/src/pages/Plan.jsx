// Plan ("What should I do with what's left?"): last month's leftover, the emergency fund and goals as rings,
// and the ways to use money left over as short cards. Full goal editing and the detailed plan stay one link away.
import { Link } from 'react-router-dom';
import { ArrowRight, CircleAlert, PartyPopper, Plus } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getPlan } from '../services/api';
import PageState from '../components/ui/PageState';
import PageHeader from '../components/ui/PageHeader';
import InfoTip from '../components/ui/InfoTip';
import ProgressItem from '../components/plan/ProgressItem';
import OptionCard from '../components/plan/OptionCard';
import { exact, rounded } from '../utils/money';

const LINK = 'inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:underline';

export default function Plan() {
  const api = useApi(getPlan);
  if (!api.ready) return <PageState state={api} />;
  const { leftover, emergency, goals, options, disclaimer } = api.data;
  const saved = leftover.amount >= 0;
  const LeftIcon = saved ? PartyPopper : CircleAlert;

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="max-w-5xl mx-auto p-space-md lg:p-space-xl space-y-space-lg">
        <PageHeader title="Plan" />

        <section className="flex items-center gap-3 p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-[#E3E8EF]">
          <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${saved ? 'bg-emerald-100 text-emerald-800' : 'bg-error-container text-error'}`}>
            <LeftIcon size={20} />
          </span>
          <p className="font-body-lg text-body-lg text-on-surface flex flex-wrap items-center gap-1">
            {saved ? (
              <>You saved <strong>{rounded(leftover.amount)}</strong> in {leftover.month}</>
            ) : (
              <>You spent <strong>{rounded(-leftover.amount)}</strong> more than came in during {leftover.month}</>
            )}
            <InfoTip text={`Money in minus money out in ${leftover.month}, leaving out transfers between your own accounts. Exact: ${exact(leftover.amount)}.`} />
          </p>
        </section>

        <section className="space-y-space-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Your goals</h2>
            <Link to="/goals" className={LINK}>
              <Plus size={16} /> Add or edit goals
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <ProgressItem name="Emergency fund" percent={emergency.percent} line={emergency.line} />
            {goals.map((g) => (
              <ProgressItem key={g.id} name={g.name} percent={g.percent} line={g.line} warning={g.offTrack ? 'Not reachable at this pace' : null} />
            ))}
          </div>
        </section>

        <section className="space-y-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Ways to use money left over</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {options.map((o) => (
              <OptionCard key={o.title} option={o} />
            ))}
          </div>
          <p className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
            For learning only, not advice. <InfoTip text={disclaimer} />
          </p>
        </section>

        <Link to="/surplus-plan" className={LINK}>
          See the detailed plan <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
