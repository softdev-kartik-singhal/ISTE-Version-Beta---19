// One goal card: category/priority badges, feasibility pill, progress, analysis note and actions.
import { Link } from 'react-router-dom';
import { BadgeCheck, ChartColumn, CircleAlert, CircleCheck, Clock, Siren, Wallet } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import RichText from '../ui/RichText';
import { formatCurrency } from '../../utils/formatCurrency';

// Visual treatment per feasibility status.
const STATUS = {
  tight: {
    pill: 'bg-surface-container-highest text-on-tertiary-fixed-variant',
    icon: <CircleAlert size={15} className="text-tertiary" />,
    bar: 'bg-primary-container',
    needed: 'text-primary',
    box: 'bg-surface-container-low',
    action: 'bg-primary-container text-on-primary hover:bg-primary shadow-sm',
  },
  onTrack: {
    pill: 'bg-secondary-fixed text-on-secondary-fixed',
    icon: <CircleCheck size={15} className="text-primary" />,
    bar: 'bg-primary',
    needed: 'text-primary',
    box: 'bg-surface-container-low',
    action: 'bg-surface-container-high text-on-surface hover:bg-surface-variant',
  },
  unreachable: {
    pill: 'bg-error-container text-on-error-container',
    icon: <Clock size={15} className="text-error" />,
    bar: 'bg-error',
    needed: 'text-error',
    box: 'bg-error-container/30',
    action: 'bg-primary-container text-on-primary hover:bg-primary shadow-sm',
  },
};

const ANALYSIS_ICONS = {
  chart: <ChartColumn size={18} className="text-tertiary mt-0.5 shrink-0" />,
  verified: <BadgeCheck size={18} className="text-primary mt-0.5 shrink-0" />,
  siren: <Siren size={18} className="text-error mt-0.5 shrink-0" />,
  wallet: <Wallet size={18} className="text-primary mt-0.5 shrink-0" />,
};

export default function GoalCard({ goal, onEdit, onAdjust }) {
  const s = STATUS[goal.status];
  const percent = goal.percentFunded;
  const highPriority = goal.priority === 'High';

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between transition-shadow hover:shadow-md">
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-space-sm mb-space-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface font-semibold tracking-wide">
              {goal.category}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-label-sm text-label-sm ${
                highPriority ? 'bg-tertiary-fixed text-on-tertiary-fixed font-semibold' : 'bg-surface-container text-on-surface-variant font-medium'
              }`}
            >
              Priority: {goal.priority}
            </span>
          </div>
          <div className={`px-2.5 py-1 rounded-full flex items-center gap-1 font-label-sm text-label-sm font-semibold ${s.pill}`}>
            {s.icon}
            <span>{goal.statusLabel}</span>
          </div>
        </div>

        <div className="flex flex-col mb-space-md">
          <div className="flex items-baseline justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">{goal.name}</h3>
            <span className="font-currency-md text-currency-md font-semibold text-on-surface">{formatCurrency(goal.target)}</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Target date: {goal.horizon}</span>
        </div>

        <div className="flex flex-col gap-1.5 mb-space-md">
          <div className="flex justify-between font-label-sm text-label-sm">
            <span className="text-on-surface-variant font-medium">
              Accumulated: <strong className="font-currency-sm text-currency-sm text-on-surface">{formatCurrency(goal.saved)}</strong>
            </span>
            <span className="text-on-surface font-semibold">{percent}%</span>
          </div>
          <ProgressBar percent={percent} barClass={s.bar} />
          <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant pt-0.5">
            <span>Remaining Delta: {formatCurrency(goal.target - goal.saved)}</span>
            <span className={`font-currency-sm text-currency-sm font-semibold ${s.needed}`}>{formatCurrency(goal.monthlyNeeded)}/mo needed</span>
          </div>
        </div>

        <div className={`p-space-sm rounded-lg mb-space-md ${s.box}`}>
          <div className="flex items-start gap-2">
            {ANALYSIS_ICONS[goal.analysisIcon]}
            <div className="flex flex-col">
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                <RichText parts={goal.analysis} />
              </p>
              <Link className="font-label-sm text-label-sm text-primary font-semibold hover:underline mt-1 inline-flex items-center gap-0.5" to="/surplus-plan">
                See the calculation →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-space-sm pt-space-sm bg-surface-container-lowest">
        <button
          className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md cursor-pointer"
          onClick={onEdit}
        >
          Edit Goal
        </button>
        <button className={`px-3 py-1.5 rounded-lg transition-colors font-label-md text-label-md cursor-pointer ${s.action}`} onClick={onAdjust}>
          {goal.actionLabel}
        </button>
      </div>
    </div>
  );
}
