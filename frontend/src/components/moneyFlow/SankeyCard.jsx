// Money Flow card holding the column headers, the Sankey diagram and the retained/fixed/variable legend.
import { forwardRef } from 'react';
import MoneyFlowSankey from '../charts/MoneyFlowSankey';

const COLUMNS = [
  { label: '1. Inflow Sources', dot: 'bg-teal-600' },
  { label: '2. Depositories', dot: 'bg-primary-container' },
  { label: '3. Categories', dot: 'bg-amber-600' },
  { label: '4. Top Merchants', dot: 'bg-indigo-500' },
];

const SankeyCard = forwardRef(function SankeyCard({ flow, onNodeClick }, ref) {
  return (
    <div ref={ref} className="xl:col-span-8 2xl:col-span-8 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg overflow-hidden relative">
      <div className="grid grid-cols-4 gap-2 mb-4 pb-2 border-b border-surface-container font-label-sm text-label-sm uppercase tracking-wider text-outline">
        {COLUMNS.map((c) => (
          <div key={c.label} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      <div className="relative w-full h-[620px] select-none">
        <MoneyFlowSankey nodes={flow.nodes} links={flow.links} onNodeClick={onNodeClick} />
      </div>
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-surface-container font-label-sm text-label-sm text-on-surface-variant flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Wealth Retained ({flow.split.retained})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Committed / Fixed ({flow.split.fixed})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Discretionary Variable ({flow.split.variable})
          </span>
        </div>
        <div className="font-currency-sm text-[12px] text-outline">Rendered via SmartGullak Directed Graph v2.4</div>
      </div>
    </div>
  );
});

export default SankeyCard;
