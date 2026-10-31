// Transactions search + filter strip: query box, account/category pickers, flow tabs and active-filter pills.
import { Calendar, ChevronDown, Landmark, Search, Shapes, X } from 'lucide-react';

const FLOW_TABS = ['All', 'Debits', 'Credits', 'Cash only'];
const SELECT = 'appearance-none bg-transparent pr-5 font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer';

export default function TransactionFilters({ filters, onChange, accounts, categories, dateRange }) {
  const set = (field) => (value) => onChange({ ...filters, [field]: value });

  // One pill per active filter; its X clears just that filter.
  const pills = [
    filters.query && { label: `Query: "${filters.query}"`, clear: () => set('query')('') },
    filters.account !== 'all' && { label: `Account: ${filters.account}`, clear: () => set('account')('all') },
    filters.category !== 'all' && { label: `Category: ${filters.category}`, clear: () => set('category')('all') },
    filters.flow !== 'All' && { label: `Type: ${filters.flow}`, clear: () => set('flow')('All') },
  ].filter(Boolean);

  return (
    <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm space-y-space-md">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            className="w-full h-10 pl-10 pr-10 rounded-lg bg-surface font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container"
            placeholder="Search merchant, UTR, amount, notes..."
            type="text"
            value={filters.query}
            onChange={(e) => set('query')(e.target.value)}
          />
          {filters.query && (
            <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface" onClick={() => set('query')('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          <label className="relative flex items-center bg-surface rounded-lg px-space-sm py-2 gap-2 cursor-pointer hover:bg-surface-container-low transition-colors">
            <Landmark size={18} className="text-secondary" />
            <select className={SELECT} value={filters.account} onChange={(e) => set('account')(e.target.value)}>
              <option value="all">All accounts ({accounts.length})</option>
              {accounts.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <ChevronDown size={16} className="text-secondary absolute right-2 pointer-events-none" />
          </label>
          <label className="relative flex items-center bg-surface rounded-lg px-space-sm py-2 gap-2 cursor-pointer hover:bg-surface-container-low transition-colors">
            <Shapes size={18} className="text-secondary" />
            <select className={SELECT} value={filters.category} onChange={(e) => set('category')(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={16} className="text-secondary absolute right-2 pointer-events-none" />
          </label>
          <div className="flex items-center bg-surface rounded-lg px-space-sm py-2 gap-2">
            <Calendar size={18} className="text-secondary" />
            <span className="font-label-md text-label-md text-on-surface">{dateRange}</span>
          </div>
          <div className="flex p-0.5 rounded-lg bg-surface">
            {FLOW_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => set('flow')(tab)}
                className={
                  tab === filters.flow
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
          {pills.length === 0 && <span>None</span>}
          {pills.map((pill) => (
            <span key={pill.label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container text-on-surface">
              <span>{pill.label}</span>
              <button className="hover:text-error" onClick={pill.clear}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <button
          className="text-primary font-label-md text-label-md hover:underline flex items-center gap-1"
          onClick={() => onChange({ query: '', account: 'all', category: 'all', flow: 'All' })}
        >
          <span>Reset all</span>
        </button>
      </div>
    </div>
  );
}
