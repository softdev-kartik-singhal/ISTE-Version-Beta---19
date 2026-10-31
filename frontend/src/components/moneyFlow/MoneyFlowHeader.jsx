// Money Flow title row with month picker, comparison toggle, merchant-count toggle and view buttons.
import { Calendar, ChevronDown, Info, Maximize, Scan } from 'lucide-react';
import SegmentedToggle from '../ui/SegmentedToggle';

const COMPARE_OPTIONS = [
  { value: 'prev', label: 'Prev Month' },
  { value: 'avg3', label: '3-Mo Average' },
];
const TOP_OPTIONS = [
  { value: 5, label: 'Top 5' },
  { value: 10, label: 'Top 10' },
];

export default function MoneyFlowHeader({ monthLabel, compare, topN, onCompareChange, onTopNChange, onResetView, onFullscreen }) {
  return (
    <div className="flex flex-col gap-space-md mb-space-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Money Flow</h1>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
              <Info size={14} />
              <span>Transfers between your own accounts left out</span>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">Where each rupee went: from income, through your accounts, to categories and shops.</p>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="relative inline-flex items-center bg-surface-container-lowest rounded-lg shadow-sm px-3 py-2 cursor-pointer hover:bg-surface-container-low transition-colors">
            <Calendar size={18} className="text-primary mr-2" />
            <span className="font-label-md text-label-md text-on-surface">{monthLabel}</span>
            <ChevronDown size={16} className="text-outline ml-2" />
          </div>
          <SegmentedToggle options={COMPARE_OPTIONS} value={compare} onChange={onCompareChange} activeTextClass="text-primary" />
          <SegmentedToggle options={TOP_OPTIONS} value={topN} onChange={onTopNChange} padClass="px-2.5" />
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant transition-colors shadow-sm" title="Reset Zoom" type="button" onClick={onResetView}>
              <Scan size={18} />
            </button>
            <button className="p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant transition-colors shadow-sm" title="Fullscreen" type="button" onClick={onFullscreen}>
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
