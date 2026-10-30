// Ask cashflow waterfall: step-by-step ledger across Worst / Typical / Best case, ending in net safe surplus.
import { CircleMinus, CirclePlus, Info, Shield, ShoppingBag, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

// Visual style per row kind; cells are [worst, typical, best].
const KINDS = {
  balance: {
    row: 'hover:bg-surface-container-lowest/50 transition-colors',
    title: 'font-medium text-on-surface',
    cells: ['text-on-surface', 'font-semibold text-on-surface bg-surface-container-high/20', 'text-on-surface'],
  },
  income: {
    row: 'hover:bg-surface-container-lowest/50 transition-colors',
    title: 'font-medium text-emerald-800 flex items-center gap-1.5',
    icon: <CirclePlus size={18} />,
    cells: ['text-emerald-700 font-medium', 'text-emerald-800 font-bold bg-surface-container-high/20', 'text-emerald-700 font-medium'],
  },
  expense: {
    row: 'hover:bg-surface-container-lowest/50 transition-colors',
    title: 'font-medium text-on-surface flex items-center gap-1.5',
    icon: <CircleMinus size={18} className="text-secondary" />,
    tag: 'px-2 py-0.5 rounded text-secondary bg-surface-container-high font-label-sm text-label-sm',
    cells: ['text-secondary', 'text-secondary font-semibold bg-surface-container-high/20', 'text-secondary'],
  },
  buffer: {
    row: 'bg-amber-50/50',
    title: 'font-medium text-amber-900 flex items-center gap-1.5',
    icon: <Shield size={18} className="text-amber-700" />,
    tag: 'px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-label-sm text-label-sm',
    detail: 'text-amber-800/80',
    cells: ['text-amber-900 font-medium', 'text-amber-900 font-semibold bg-surface-container-high/20', 'text-amber-900 font-medium'],
  },
  purchase: {
    row: 'bg-surface-variant/40',
    pad: 'py-4',
    title: 'font-semibold text-primary flex items-center gap-1.5',
    icon: <ShoppingBag size={20} className="text-primary-container" />,
    tag: 'px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm',
    cells: ['text-primary font-bold', 'text-primary font-extrabold bg-surface-container-high/30', 'text-primary font-bold'],
  },
};

const RESULT_TONES = {
  bad: { value: 'text-error', badge: 'bg-error-container text-on-error-container' },
  good: { value: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
};

export default function WaterfallTable({ waterfall }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
        <div>
          <div className="flex items-center gap-2">
            <Wallet size={22} className="text-primary" />
            <h3 className="font-headline-md text-headline-md text-on-surface">Cashflow Waterfall Analysis ({waterfall.period})</h3>
          </div>
          <p className="font-body-md text-body-md text-secondary">Step-by-step liquidity breakdown across Worst, Typical, and Best case scenarios.</p>
        </div>
        <div className="flex items-center gap-2 text-secondary font-label-sm text-label-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>Normalized against 180-day recurring debits</span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-surface">
        <table className="w-full text-left font-body-md text-body-md">
          <thead className="bg-surface-container-low font-label-md text-label-md text-secondary uppercase tracking-wider">
            <tr>
              <th className="py-3 px-space-md font-semibold text-on-surface" scope="col">Item / Cashflow Step</th>
              <th className="py-3 px-space-md font-semibold text-right text-secondary" scope="col">
                Worst Case <span className="block font-label-sm text-label-sm lowercase font-normal">{waterfall.scenarios[0]}</span>
              </th>
              <th className="py-3 px-space-md font-semibold text-right text-primary-container bg-surface-container-high/40" scope="col">
                Typical Case <span className="block font-label-sm text-label-sm lowercase font-normal">{waterfall.scenarios[1]}</span>
              </th>
              <th className="py-3 px-space-md font-semibold text-right text-emerald-800" scope="col">
                Best Case <span className="block font-label-sm text-label-sm lowercase font-normal">{waterfall.scenarios[2]}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {waterfall.rows.map((row) => {
              const kind = KINDS[row.kind];
              const pad = kind.pad || 'py-3.5';
              return (
                <tr key={row.id} className={kind.row}>
                  <td className={`${pad} px-space-md`}>
                    <div className={kind.title}>
                      {kind.icon}
                      <span>{row.title}</span>
                      {row.tag && <span className={kind.tag}>{row.tag}</span>}
                    </div>
                    <div className={`font-label-sm text-label-sm ${kind.detail || 'text-secondary'}`}>{row.detail}</div>
                  </td>
                  {row.values.map((value, i) => (
                    <td key={i} className={`${pad} px-space-md text-right font-currency-md text-currency-sm ${kind.cells[i]}`}>
                      {formatCurrency(value, { sign: row.kind === 'income' })}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="bg-surface-container-low font-semibold">
              <td className="py-4 px-space-md">
                <div className="font-headline-sm text-headline-sm text-on-surface">Net Safe Surplus Remaining</div>
                <div className="font-label-sm text-label-sm text-secondary font-normal">Buffer-protected liquidity available post-purchase</div>
              </td>
              {waterfall.result.map((r, i) => {
                const tone = RESULT_TONES[r.tone];
                return (
                  <td key={i} className={`py-4 px-space-md text-right ${i === 1 ? 'bg-surface-container-high/50' : ''}`}>
                    <div className={`font-currency-md text-currency-md font-bold ${tone.value}`}>
                      {formatCurrency(r.value, { sign: true })} {r.value < 0 ? 'DR' : 'CR'}
                    </div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${tone.badge}`}>{r.label}</span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex items-start gap-2.5 p-space-sm bg-surface-container-low/60 rounded-lg text-secondary font-label-sm text-label-sm">
        <Info size={18} className="text-surface-tint shrink-0" />
        <span>
          <strong>Safety Buffer Logic:</strong> {waterfall.bufferNote}
        </span>
      </div>
    </div>
  );
}
