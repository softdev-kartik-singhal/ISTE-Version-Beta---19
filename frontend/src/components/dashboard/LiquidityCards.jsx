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
        icon={Wallet}
        iconClass="text-primary"
        value={formatCurrency(liquidity.safeToSpendWeek)}
        badge={
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed">
            Live buffer
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
        icon={PiggyBank}
        iconClass="text-secondary"
        value={formatCurrency(liquidity.moneyLeftMonth)}
        badge={<span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-secondary">projected</span>}
        footer={
          <p className="font-body-sm text-body-sm text-secondary flex items-center justify-between">
            <span>Surplus buffer intact</span>
            <span className="font-medium text-on-surface">{liquidity.daysLeft} days left</span>
          </p>
        }
      />
      <LiquidityCard
        label="Last month's surplus"
        icon={TrendingUp}
        iconClass="text-emerald-400"
        value={formatCurrency(liquidity.lastMonthSurplus, { sign: true })}
        valueClass="text-emerald-400"
        badge={
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-label-sm font-label-sm bg-emerald-400/10 text-emerald-400 font-semibold">
            CR
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
        label="Upcoming payments (7 days)"
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
            Verified against balance • {liquidity.mandates} mandates
          </p>
        }
      />
    </section>
  );
}
