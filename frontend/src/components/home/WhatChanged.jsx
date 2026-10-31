// "What changed": up to 3 cards, each one plain headline, one supporting number and one button to the transactions.
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { iconFor } from '../../utils/icons';
import { exact, rounded } from '../../utils/money';

export default function WhatChanged({ changes, month }) {
  return (
    <section className="home-in space-y-3" style={{ '--delay': '420ms' }} aria-labelledby="what-changed">
      <h2 id="what-changed" className="text-[18px] font-semibold text-[#0b2545]">What changed in {month}</h2>
      {changes.length === 0 ? (
        <p className="home-card p-5 text-[14px] text-slate-600">Comparisons start after 4 months of statements.</p>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {changes.map((c) => {
            const Icon = iconFor(c.icon);
            const Arrow = c.up ? ArrowUp : ArrowDown;
            return (
              <article key={c.id} className="home-card lift p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-xl bg-slate-100 text-[#0b2545] flex items-center justify-center"><Icon size={19} aria-hidden="true" /></span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold ${c.up ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800'}`}>
                    <Arrow size={12} aria-hidden="true" /> {c.up ? 'Higher' : 'Lower'}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold leading-snug text-[#0b2545]">{c.headline}</h3>
                <p className="text-[13px] text-slate-600">
                  <span className="tabular font-semibold text-[#0b2545]" title={`Exact: ${exact(c.now)}`}>{rounded(c.now)}</span> vs usual{' '}
                  <span className="tabular" title={`Exact: ${exact(c.usual)}`}>{rounded(c.usual)}</span>
                </p>
                <Link to="/transactions" state={{ category: c.category }} className="mt-auto self-start inline-flex items-center gap-1 text-[14px] font-semibold text-[#1d4ed8] hover:underline">
                  See {c.category.toLowerCase()} <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
