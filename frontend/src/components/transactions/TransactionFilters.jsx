// Transactions search + filter strip: query box, account/category/date pickers, flow tabs and active-filter pills.
// Filters are UI state only for now; real filtering will happen in getTransactions() once the backend exists.
import { useState } from 'react';
import { Calendar, ChevronDown, Landmark, Search, Shapes, X } from 'lucide-react';

const FLOW_TABS = ['All', 'Debits', 'Credits'];

export default function TransactionFilters({ filters }) {
  const [query, setQuery] = useState(filters.query);
  const [flow, setFlow] = useState('All');
  const [pills, setPills] = useState(filters.activePills);

  function resetAll() {
    setQuery('');
    setFlow('All');
    setPills([]);
  }

  return (
    <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm space-y-space-md">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            className="w-full h-10 pl-10 pr-10 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container"
            placeholder="Search merchant, UTR, amount, notes..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface" onClick={() => setQuery('')}>
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center bg-surface rounded-lg px-space-sm py-2 gap-2 cursor-pointer hover:bg-surface-container-low transition-colors">
            <Landmark size={18} className="text-secondary" />
            <span className="font-label-md text-label-md text-on-surface">All accounts ({filters.accountCount})</span>
            <ChevronDown size={16} className="text-secondary" />
          </div>
          <div className="flex items-center bg-surface rounded-lg px-space-sm py-2 gap-2 cursor-pointer hover:bg-surface-container-low transition-colors">
            <Shapes size={18} className="text-secondary" />
            <span className="font-label-md text-label-md text-on-surface">All categories</span>
            <ChevronDown size={16} className="text-secondary" />
          </div>
          <div className="flex items-center bg-surface rounded-lg px-space-sm py-2 gap-2 cursor-pointer hover:bg-surface-container-low transition-colors">
            <Calendar size={18} className="text-secondary" />
            <span className="font-label-md text-label-md text-on-surface">{filters.dateRange}</span>
            <ChevronDown size={16} className="text-secondary" />
          </div>
          <div className="flex p-0.5 rounded-lg bg-surface">
            {FLOW_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setFlow(tab)}
                className={
                  tab === flow
                    ? 'px-space-sm py-1.5 rounded-md font-label-md text-label-md text-on-surface bg-surface-container-lowest shadow-sm'
                    : 'px-space-sm py-1.5 rounded-md font-label-md text-label-md text-secondary hover:text-on-surface'
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-space-xs text-secondary font-label-sm text-label-sm">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="text-secondary font-medium">Active filters:</span>
          {pills.map((pill) => (
            <span key={pill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container text-on-surface">
              <span>{pill}</span>
              <button className="hover:text-error" onClick={() => setPills(pills.filter((p) => p !== pill))}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <button className="text-primary font-label-md text-label-md hover:underline flex items-center gap-1" onClick={resetAll}>
          <span>Reset all</span>
        </button>
      </div>
    </div>
  );
}
