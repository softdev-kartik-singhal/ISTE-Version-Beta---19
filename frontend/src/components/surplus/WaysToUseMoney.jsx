// "What your money could do": a fixed deposit, a recurring deposit and insurance, worked out from the user's own cash,
// monthly leftover and spending. The rates are examples the user can change; nothing here is an offer or a promise.
// Layout: one hero number per card (what you would earn), then a few label/value rows instead of sentences.
import { useEffect, useState } from 'react';
import { CircleCheck, CircleAlert, HeartPulse, Landmark, PiggyBank, ShieldCheck, Users } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getWaysToUseMoney } from '../../services/api';
import { exact, shortRupees } from '../../utils/money';

const money = (n) => shortRupees(n);

// Compact "[ 7 ] % a year" pill in the card footer (the footer text beside it says "Example rate").
function RateInput({ value, onChange }) {
  return (
    <label className="inline-flex items-center gap-1 h-8 pl-3 pr-3 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant focus-within:ring-1 focus-within:ring-primary-container">
      <input
        type="number" min="0" max="15" step="0.1" inputMode="decimal" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 bg-transparent text-right font-semibold text-on-surface focus:outline-none"
      />
      % a year
    </label>
  );
}

function Card({ icon: Icon, title, tag, children, footer }) {
  return (
    <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-[#E3E8EF] flex flex-col gap-space-md">
      <header className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2.5 font-headline-sm text-headline-sm text-on-surface">
          <span className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center"><Icon size={19} /></span>
          {title}
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">{tag}</span>
      </header>
      <div className="flex-1 flex flex-col gap-space-md">{children}</div>
      {footer && <footer className="flex items-center justify-between gap-2 pt-space-sm border-t border-[#EEF1F5]">{footer}</footer>}
    </article>
  );
}

// The one number that matters on the card, with a short caption under it.
const Hero = ({ value, title, caption }) => (
  <div>
    <p className="font-currency-hero text-currency-hero text-emerald-700 font-semibold tracking-tight" title={title}>{value}</p>
    <p className="font-label-sm text-label-sm text-on-surface-variant">{caption}</p>
  </div>
);

// Label on the left, number on the right; `strong` highlights the row that answers "is it worth it".
function Rows({ rows }) {
  return (
    <dl className="divide-y divide-[#EEF1F5]">
      {rows.map(({ label, value, title, strong }) => (
        <div key={label} className="flex items-baseline justify-between gap-3 py-1.5">
          <dt className="font-body-sm text-body-sm text-on-surface-variant">{label}</dt>
          <dd className={`font-currency-sm text-currency-sm whitespace-nowrap ${strong ? 'font-semibold text-emerald-700' : 'text-on-surface'}`} title={title}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const Empty = ({ children }) => <p className="font-body-sm text-body-sm text-on-surface-variant">{children}</p>;
const Note = ({ children }) => <span className="font-label-sm text-label-sm text-on-surface-variant">{children}</span>;

// One insurance line: found (green tick) or missing (amber), with the number that matters.
function Cover({ icon: Icon, title, found, value, valueTitle, detail }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low">
      <span className="w-8 h-8 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shrink-0"><Icon size={17} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-md text-label-md text-on-surface font-semibold">{title}</span>
          {found
            ? <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-emerald-800"><CircleCheck size={14} /> In your payments</span>
            : <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-amber-800"><CircleAlert size={14} /> Not found</span>}
        </div>
        {!found && (
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            {value && <strong className="text-on-surface font-semibold" title={valueTitle}>{value} </strong>}{detail}
          </p>
        )}
      </div>
    </div>
  );
}

// Debounces the typed rate so the server is asked once the user stops typing.
function useRate() {
  const [typed, setTyped] = useState('');
  const [applied, setApplied] = useState(null);
  useEffect(() => {
    if (typed === '') return undefined;
    const t = setTimeout(() => setApplied(Math.min(15, Math.max(0, Number(typed)))), 400);
    return () => clearTimeout(t);
  }, [typed]);
  return [typed, setTyped, applied];
}

export default function WaysToUseMoney() {
  const [fdTyped, setFdTyped, fdRate] = useRate();
  const [rdTyped, setRdTyped, rdRate] = useRate();
  const api = useApi(() => getWaysToUseMoney(fdRate, rdRate), [fdRate, rdRate]);
  if (!api.ready) return null; // an extra section: nothing to show until there is data

  const w = api.data;
  const { base, fd, rd, policy } = w;
  return (
    <div className="flex flex-col gap-space-md">
      <p className="font-body-md text-body-md text-on-surface-variant">
        {base.funded
          ? <><strong className="text-on-surface" title={exact(base.spare)}>{money(base.spare)}</strong> above your safety net · <strong className="text-on-surface" title={exact(base.leftover)}>{money(base.leftover)}</strong> usually left each month</>
          : <>Fill your safety net first: <strong className="text-on-surface" title={exact(base.shortfall)}>{money(base.shortfall)}</strong> to go. After that, extra money can work harder.</>}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        <Card icon={Landmark} title="Fixed deposit" tag="Lump sum"
          footer={<><Note>Example rate</Note><RateInput value={fdTyped === '' ? w.rates.fd : fdTyped} onChange={setFdTyped} /></>}>
          {fd.amount > 0 ? (
            <>
              <Hero value={`+${money(fd.interest)}`} title={exact(fd.interest)} caption="interest in a year" />
              <Rows rows={[
                { label: 'You put in', value: money(fd.amount), title: `${exact(fd.amount)}: the cash above your safety net` },
                { label: 'Savings account instead', value: money(fd.idleInterest), title: exact(fd.idleInterest) },
                { label: 'Extra you earn', value: `+${money(fd.extra)}`, title: exact(fd.extra), strong: true },
              ]} />
            </>
          ) : (
            <Empty>Nothing to put away yet: your safety net comes first and should stay easy to reach.</Empty>
          )}
        </Card>

        <Card icon={PiggyBank} title="Recurring deposit" tag="Monthly"
          footer={<><Note>Example rate</Note><RateInput value={rdTyped === '' ? w.rates.rd : rdTyped} onChange={setRdTyped} /></>}>
          {rd.monthly > 0 ? (
            <>
              <Hero value={`+${money(rd.interest)}`} title={exact(rd.interest)} caption={`interest over ${rd.months} months`} />
              <Rows rows={[
                { label: `Each month (${rd.sharePct}% of leftover)`, value: money(rd.monthly), title: exact(rd.monthly) },
                { label: 'You deposit', value: money(rd.deposited), title: exact(rd.deposited) },
                { label: 'You get back', value: money(rd.total), title: exact(rd.total), strong: true },
              ]} />
              {rd.fillsNetInMonths != null && (
                <p className="font-label-sm text-label-sm text-on-surface-variant">Also fills your safety net in about {rd.fillsNetInMonths} month{rd.fillsNetInMonths === 1 ? '' : 's'}.</p>
              )}
            </>
          ) : (
            <Empty>You have no usual monthly leftover to set aside right now.</Empty>
          )}
        </Card>

        <Card icon={ShieldCheck} title="Insurance" tag="Protection"
          footer={<Note>Doesn&apos;t earn interest. It protects your savings from a big shock.</Note>}>
          <Cover icon={Users} title="Life cover" found={policy.hasLife}
            value={money(policy.lifeCover)} valueTitle={exact(policy.lifeCover)}
            detail={`suggested if anyone depends on you (about ${policy.coverYears} years of essentials)`} />
          <Cover icon={HeartPulse} title="Health cover" found={policy.hasHealth}
            detail={`A ${money(policy.exampleBill)} hospital bill would use ${policy.billShare != null ? `${policy.billShare}% of` : 'a large part of'} your savings.`} />
        </Card>
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant">Example rates and amounts, not offers. Check current rates and terms before you decide.</p>
    </div>
  );
}
