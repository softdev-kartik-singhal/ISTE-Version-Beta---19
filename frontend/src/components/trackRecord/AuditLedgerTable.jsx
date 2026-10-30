// "Immutable Prediction Audit Ledger" table with a text filter over questions and verdicts.
import { useState } from 'react';
import { CheckCheck, ChevronDown, ListFilter } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const VERDICT_STYLES = {
  safe: { pill: 'bg-surface-container text-primary', dot: 'bg-primary' },
  conditional: { pill: 'bg-tertiary-fixed text-tertiary', dot: 'bg-tertiary' },
  risk: { pill: 'bg-tertiary-fixed text-tertiary', dot: 'bg-tertiary' },
};
const VERDICT_FILTERS = ['All Verdicts', 'Affordable / Safe', 'Conditional Approval', 'Buffer Risk'];

export default function AuditLedgerTable({ ledger }) {
  const [query, setQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState(VERDICT_FILTERS[0]);
  const visible = ledger.entries.filter((e) => `${e.timestamp} ${e.question} ${e.verdict}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-xl shadow-sm space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Immutable Prediction Audit Ledger</h3>
          <p className="font-body-sm text-body-sm text-secondary">Every recommendation is hashed at issuance time with input balance &amp; salary assumptions</p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="relative">
            <ListFilter size={18} className="absolute left-2.5 top-2.5 text-secondary" />
            <input
              className="h-9 pl-9 pr-3 text-body-sm font-body-sm rounded-lg bg-surface-container-low text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary w-56"
              placeholder="Filter questions, verdicts..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="h-9 px-3 text-label-md font-label-md rounded-lg bg-surface-container-low text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
          >
            {VERDICT_FILTERS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-secondary font-label-md text-label-md border-b border-surface-container">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Purchase Question</th>
              <th className="py-3 px-4">Model Verdict</th>
              <th className="py-3 px-4 text-right">Projected Surplus</th>
              <th className="py-3 px-4 text-right">Actual Surplus</th>
              <th className="py-3 px-4 font-currency-sm">SHA-256 Anchor</th>
              <th className="py-3 px-4 text-right">Ledger State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm">
            {visible.map((e) => {
              const style = VERDICT_STYLES[e.verdictType];
              return (
                <tr key={e.hash} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-4 font-currency-sm text-secondary whitespace-nowrap">{e.timestamp}</td>
                  <td className="py-3.5 px-4 font-semibold text-on-surface">{e.question}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${style.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} /> {e.verdict}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-currency-sm text-on-surface font-medium">{e.projectedLabel || formatCurrency(e.projected)}</td>
                  <td className={`py-3.5 px-4 text-right font-currency-sm ${e.actualClass}`}>{e.actual == null ? 'Did not purchase' : formatCurrency(e.actual)}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-currency-sm text-label-sm text-secondary bg-surface-container-low px-2 py-0.5 rounded">{e.hash}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-medium">
                      <CheckCheck size={14} /> Settled • Verified
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pt-space-sm flex items-center justify-between text-secondary font-body-sm text-body-sm">
        <span>
          Showing {visible.length} of {ledger.total} immutable prediction logs
        </span>
        <button className="text-primary hover:underline font-label-md text-label-md inline-flex items-center gap-1">
          <span>Load earlier records</span>
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
}
