// "What your money could do": a fixed deposit, a recurring deposit and insurance, worked out from the user's own cash,
// monthly leftover and spending. The rates are examples the user can change; nothing here is an offer or a promise.
import { useEffect, useState } from 'react';
import { Landmark, PiggyBank, ShieldCheck } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getWaysToUseMoney } from '../../services/api';
import { exact, shortRupees } from '../../utils/money';

const money = (n) => shortRupees(n);

function RateInput({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
      {label}
      <input
        type="number" min="0" max="15" step="0.1" inputMode="decimal" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 h-8 px-2 rounded-lg bg-surface-container-low text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
      />
      % a year
    </label>
  );
}

function Card({ icon: Icon, title, children, footer }) {
  return (
    <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-[#E3E8EF] flex flex-col gap-space-sm">
      <h3 className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
        <span className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center"><Icon size={19} /></span>
        {title}
      </h3>
      <div className="flex-1 space-y-1.5">{children}</div>
      {footer}
    </article>
  );
}

const Big = ({ children, title }) => <p className="font-currency-hero text-currency-hero text-on-surface font-semibold tracking-tight" title={title}>{children}</p>;
const Line = ({ children }) => <p className="font-body-sm text-body-sm text-on-surface-variant">{children}</p>;

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
      <p className="font-body-md text-body-md text-on-surface">
        {base.funded
          ? <>You have <strong title={exact(base.spare)}>{money(base.spare)}</strong> above your safety net and usually <strong title={exact(base.leftover)}>{money(base.leftover)}</strong> left each month. Here is what different choices could do.</>
          : <>Fill your safety net first (<strong title={exact(base.shortfall)}>{money(base.shortfall)}</strong> to go). After that, extra money can work harder. Here is what each choice could do.</>}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        <Card icon={Landmark} title="Fixed deposit"
          footer={<RateInput label="Example rate" value={fdTyped === '' ? w.rates.fd : fdTyped} onChange={setFdTyped} />}>
          {fd.amount > 0 ? (
            <>
              <Big title={exact(fd.interest)}>{money(fd.interest)} <span className="font-body-md text-body-md font-medium text-on-surface-variant">in a year</span></Big>
              <Line>
                On {money(fd.amount)}, the cash above your safety net. Left in a savings account it would earn about {money(fd.idleInterest)}, so a deposit adds about <strong className="text-on-surface">{money(fd.extra)}</strong>.
              </Line>
            </>
          ) : (
            <Line>Nothing to put away yet: your safety net comes first and should stay easy to reach.</Line>
          )}
        </Card>

        <Card icon={PiggyBank} title="Recurring deposit"
          footer={<RateInput label="Example rate" value={rdTyped === '' ? w.rates.rd : rdTyped} onChange={setRdTyped} />}>
          {rd.monthly > 0 ? (
            <>
              <Big title={exact(rd.total)}>{money(rd.total)} <span className="font-body-md text-body-md font-medium text-on-surface-variant">in a year</span></Big>
              <Line>
                Put {money(rd.monthly)} a month ({rd.sharePct}% of your usual leftover) aside for {rd.months} months: you deposit {money(rd.deposited)} and earn about <strong className="text-on-surface">{money(rd.interest)}</strong>.
              </Line>
              {rd.fillsNetInMonths != null && <Line>That would also fill your safety net in about {rd.fillsNetInMonths} month{rd.fillsNetInMonths === 1 ? '' : 's'}.</Line>}
            </>
          ) : (
            <Line>You have no usual monthly leftover to set aside right now.</Line>
          )}
        </Card>

        <Card icon={ShieldCheck} title="Insurance policies"
          footer={<p className="font-label-sm text-label-sm text-on-surface-variant">Insurance doesn&apos;t earn interest: it protects your savings from a big shock.</p>}>
          <Line>
            {policy.hasLife
              ? 'A life insurance premium shows in your payments.'
              : <>No life insurance premium shows in your payments. If anyone depends on your income, a common rule of thumb is cover worth about {policy.coverYears} years of your essential spending: <strong className="text-on-surface" title={exact(policy.lifeCover)}>{money(policy.lifeCover)}</strong>.</>}
          </Line>
          <Line>
            {policy.hasHealth
              ? 'A health insurance premium shows in your payments.'
              : <>No health insurance premium shows either. A {money(policy.exampleBill)} hospital bill would use {policy.billShare != null ? `${policy.billShare}% of` : 'a large part of'} your savings.</>}
          </Line>
        </Card>
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant">Example rates and amounts, not offers. Check current rates and terms before you decide.</p>
    </div>
  );
}
