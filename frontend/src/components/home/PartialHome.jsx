// Home for an account (or a whole upload) that has less than one complete calendar month of data: a one-month PDF that
// starts mid-month, or the Cash wallet. We show plain totals over the days we do have, and say plainly that there is no
// forecast yet. Nothing here is estimated.
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Info, PiggyBank, Wallet } from 'lucide-react';
import CashAndActions from './CashAndActions';
import { exact, rounded } from '../../utils/money';

const day = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function Stat({ icon: Icon, tint, label, paise, tone = 'text-[#0b2545]' }) {
  const rupees = paise / 100;
  return (
    <article className="home-card p-4 sm:p-5 flex items-center gap-3">
      <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tint}`}><Icon size={19} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className={`tabular text-[22px] sm:text-[26px] font-extrabold tracking-tight leading-none ${tone}`} title={`Exact: ${exact(rupees)}`}>
          {paise > 0 && label === 'Left over' ? '+' : ''}{rounded(rupees)}
        </p>
        <p className="mt-1.5 text-[13px] text-slate-600">{label}</p>
      </div>
    </article>
  );
}

export default function PartialHome({ partial: p }) {
  const top = p.categories[0]?.amountPaise || 1;
  return (
    <>
      <section className="home-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" aria-label="What this covers">
        <div>
          <p className="text-[13px] text-slate-500 uppercase tracking-wide font-semibold">So far</p>
          <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#0b2545]">{day(p.firstDate)} – {day(p.lastDate)}</h1>
          <p className="text-[14px] text-slate-600">{p.days} days · {p.transactions} transaction{p.transactions === 1 ? '' : 's'}</p>
        </div>
        <div className="sm:max-w-md flex items-start gap-2 p-3 rounded-xl bg-blue-50 text-[13px] text-blue-900">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            This covers less than one full calendar month, so there is no forecast or &ldquo;usual month&rdquo; yet. These are plain totals for the days above.
            Add earlier statements and the full Home fills in. <Link to="/statements" className="font-semibold underline">Add statements</Link>
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4" aria-label="Totals so far">
        <Stat icon={Wallet} tint="bg-blue-50 text-[#1d4ed8]" label="Balance on the last day" paise={p.cashPaise} />
        <Stat icon={ArrowDownLeft} tint="bg-emerald-50 text-emerald-700" label="Money in" paise={p.inflowPaise} />
        <Stat icon={ArrowUpRight} tint="bg-red-50 text-red-700" label="Money out" paise={p.outflowPaise} />
        <Stat icon={PiggyBank} tint="bg-slate-100 text-slate-700" label="Left over" paise={p.surplusPaise} tone={p.surplusPaise < 0 ? 'text-red-700' : 'text-emerald-700'} />
      </section>

      <CashAndActions />

      {p.categories.length > 0 && (
        <section className="home-card p-5 sm:p-6" aria-labelledby="partial-where">
          <h2 id="partial-where" className="text-[18px] font-semibold text-[#0b2545]">Where the money went</h2>
          <ul className="mt-4 space-y-3">
            {p.categories.map((c) => (
              <li key={c.name}>
                <Link to="/transactions" state={{ category: c.name }} className="block group">
                  <div className="flex items-baseline justify-between text-[14px]">
                    <span className="text-slate-700 group-hover:text-[#1d4ed8]">{c.name}</span>
                    <span className="tabular font-semibold text-[#0b2545]" title={`Exact: ${exact(c.amountPaise / 100)}`}>{rounded(c.amountPaise / 100)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#1d4ed8]" style={{ width: `${Math.max(3, (c.amountPaise / top) * 100)}%` }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
