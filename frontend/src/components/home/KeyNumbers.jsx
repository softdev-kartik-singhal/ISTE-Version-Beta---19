// Four compact key-number cards: safe to spend per week, money left this month, last month's surplus, due in 7 days.
// Each has an icon, a big rounded number (exact on hover), a short label, a small pill and a sparkline.
import { ArrowDown, ArrowUp, CalendarClock, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import InfoTip from '../ui/InfoTip';
import Sparkline from './Sparkline';
import { useCountUp } from '../../hooks/useMotion';
import { exact, rounded } from '../../utils/money';

function KeyCard({ icon: Icon, tint, label, tip, value, pill, spark, bars, delay }) {
  const shown = useCountUp(value, true, 900);
  return (
    <article className="home-card lift home-in p-4 sm:p-5 flex flex-col gap-3" style={{ '--delay': `${delay}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tint}`}><Icon size={19} aria-hidden="true" /></span>
        <InfoTip text={tip} />
      </div>
      <div>
        <p className="tabular text-[24px] sm:text-[28px] font-extrabold tracking-tight text-[#0b2545] leading-none" title={`Exact: ${exact(value)}`}>
          {rounded(shown)}
        </p>
        <p className="mt-1.5 text-[13px] text-slate-600">{label}</p>
      </div>
      {pill}
      <Sparkline values={spark} bars={bars} />
    </article>
  );
}

const Pill = ({ children, tone = 'slate' }) => {
  const tones = { slate: 'bg-slate-100 text-slate-700', up: 'bg-emerald-50 text-emerald-800', down: 'bg-red-50 text-red-800' };
  return <span className={`self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium ${tones[tone]}`}>{children}</span>;
};

export default function KeyNumbers({ keys }) {
  const { safe, left, last, due } = keys;
  return (
    <section aria-label="Key numbers" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <KeyCard
        delay={60} icon={Wallet} tint="bg-blue-50 text-[#1d4ed8]" value={safe.value} spark={safe.spark}
        label="Safe to spend this week"
        tip="Money left until your next salary, after bills due before it and keeping your safety cushion, divided by the weeks to go."
        pill={<Pill><CalendarClock size={12} aria-hidden="true" /> until {safe.until}</Pill>}
      />
      <KeyCard
        delay={120} icon={PiggyBank} tint="bg-indigo-50 text-indigo-700" value={left.value} spark={left.spark}
        label={`Money left in ${left.month}`}
        tip="Expected income minus what you've spent so far and bills still due this month."
        pill={<Pill>{left.daysLeft} days to go</Pill>}
      />
      {last ? (
        <KeyCard
          delay={180} icon={TrendingUp} tint="bg-emerald-50 text-emerald-700" value={last.value} spark={last.spark}
          label={`${last.month} surplus`}
          tip={`Money in minus money out in ${last.month}, leaving out transfers between your own accounts.`}
          pill={last.delta && (
            <Pill tone={last.delta.up ? 'up' : 'down'}>
              {last.delta.up ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />}
              {rounded(last.delta.amount)} {last.delta.up ? 'more' : 'less'} than {last.delta.vs}
            </Pill>
          )}
        />
      ) : (
        <article className="home-card p-5 text-[13px] text-slate-600">Last month&apos;s surplus appears after a full month of statements.</article>
      )}
      <KeyCard
        delay={240} icon={CalendarClock} tint="bg-amber-50 text-amber-700" value={due.value} spark={due.spark} bars
        label="Due in the next 7 days"
        tip="Regular payments (rent, EMIs, subscriptions) expected in the next 7 days, at their usual amount."
        pill={<Pill>{due.count} {due.count === 1 ? 'payment' : 'payments'}</Pill>}
      />
    </section>
  );
}
