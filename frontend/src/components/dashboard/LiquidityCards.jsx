// Row of four Dashboard metric cards: safe to spend, money left, last surplus, upcoming payments.
import { Link } from 'react-router-dom';
import { ArrowUp, CalendarSync, CircleCheck, Info, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import LiquidityCard from './LiquidityCard';
import { formatCurrency } from '../../utils/formatCurrency';

export default function LiquidityCards({ liquidity }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
      <LiquidityCard
        label="Safe to spend this week"
        tip="Money left this month, minus a small safety margin, divided by the weeks left in the month."
        icon={Wallet}
        iconClass="text-primary"
        value={formatCurrency(liquidity.safeToSpendWeek)}
        badge={
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed">
            After bills
          </span>
        }
        footer={
          <Link className="font-body-sm text-body-sm text-primary hover:underline flex items-center gap-1" to="/ask">
            <Info size={14} />
            <span>How we calculated this</span>
          </Link>
        }
      />
      <LiquidityCard
        label="Money left this month"
        tip="Expected income (what arrived, or your usual income if more) minus spending so far and bills still due this month."
        icon={PiggyBank}
        iconClass="text-secondary"
        value={formatCurrency(liquidity.moneyLeftMonth)}
        badge={<span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-secondary">estimate</span>}
        footer={
          <p className="font-body-sm text-body-sm text-secondary flex items-center justify-between">
            <span>Safety buffer untouched</span>
            <span className="font-medium text-on-surface">{liquidity.daysLeft} days left</span>
          </p>
        }
      />
      <LiquidityCard
        label="Left over last month"
        tip="Money in minus money out last month, leaving out transfers between your own accounts."
        icon={TrendingUp}
        iconClass="text-emerald-400"
        value={formatCurrency(liquidity.lastMonthSurplus, { sign: true })}
        valueClass="text-emerald-400"
        badge={
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-label-sm font-label-sm bg-emerald-400/10 text-emerald-400 font-semibold">
            Saved
          </span>
        }
        footer={
          <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
            <ArrowUp size={14} className="text-emerald-400" />
            <span>{liquidity.surplusVsPrev}</span>
          </p>
        }
      />
      <LiquidityCard
        label="Bills due in the next 7 days"
        tip="Sum of regular payments (rent, EMIs, subscriptions) expected in the next 7 days, at their usual amount."
        icon={CalendarSync}
        iconClass="text-secondary"
        value={formatCurrency(liquidity.upcomingTotal)}
        badge={
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed">
            <CircleCheck size={12} />
            {liquidity.upcomingDebits} debits
          </span>
        }
        footer={
          <p className="font-body-sm text-body-sm text-secondary truncate">
            From your regular payments • {liquidity.mandates} auto-debits
          </p>
        }
      />
    </section>
  );
}
