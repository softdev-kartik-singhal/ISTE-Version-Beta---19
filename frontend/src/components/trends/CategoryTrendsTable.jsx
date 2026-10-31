// Trends "Category Trends & Variances" table with a name filter and a sparkline per category.
import { useState } from 'react';
import { ArrowDown, ArrowUp, Minus, Search } from 'lucide-react';
import Sparkline from '../charts/Sparkline';
import { iconFor } from '../../utils/icons';
import { formatCurrency } from '../../utils/formatCurrency';

const DIRECTION_ICONS = { up: ArrowUp, down: ArrowDown, flat: Minus };

export default function CategoryTrendsTable({ categories, month }) {
  const [query, setQuery] = useState('');
  const visible = categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Categories this month vs usual</h3>
          <p className="font-body-sm text-body-sm text-secondary">Comparing {month} spending against trailing 3-month medians</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-3 top-2.5 text-secondary" />
          <input
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary-container"
            placeholder="Filter categories..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body-md text-body-md border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-secondary font-label-md text-label-md uppercase tracking-wider">
              <th className="py-3 px-space-md rounded-l-lg font-semibold">Category</th>
              <th className="py-3 px-space-md text-right font-semibold">This Month (Oct)</th>
              <th className="py-3 px-space-md text-right font-semibold">Usual</th>
              <th className="py-3 px-space-md text-right font-semibold">Change</th>
              <th className="py-3 px-space-md text-center rounded-r-lg font-semibold">6-Month Sparkline</th>
            </tr>
          </thead>
          <tbody className="text-on-surface font-body-sm text-body-sm">
            {visible.map((c) => {
              const Icon = iconFor(c.icon);
              const DirIcon = DIRECTION_ICONS[c.direction];
              return (
                <tr key={c.name} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconClass}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-on-surface">{c.name}</div>
                        <div className="font-label-sm text-label-sm text-secondary">{c.examples}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-right font-currency-sm text-currency-sm font-medium">{formatCurrency(c.thisMonth)}</td>
                  <td className="py-3.5 px-space-md text-right font-currency-sm text-currency-sm text-secondary">{formatCurrency(c.median)}</td>
                  <td className="py-3.5 px-space-md text-right">
                    <div className={`inline-flex items-center gap-1 ${c.varianceClass}`}>
                      <DirIcon size={16} />
                      <span>{c.variance}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-center">
                    <div className="w-24 mx-auto flex items-center justify-center">
                      <div className="w-20 h-6">
                        <Sparkline values={c.sparkline} color={c.sparkColor} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
