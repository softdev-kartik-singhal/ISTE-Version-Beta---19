// One row: a small cash wallet card (balance, + Cash, "₹X not recorded") and four quick-action tiles.
import { Link } from 'react-router-dom';
import { Banknote, Plus, Sparkles, Target, Upload } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getCash } from '../../services/api';
import { useCash } from '../../cash/cashContext';
import { exact, rounded } from '../../utils/money';

const TILE = 'home-card lift flex flex-col items-center justify-center gap-2 p-4 text-[14px] font-semibold text-[#0b2545] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]';
const ICON = 'w-11 h-11 rounded-2xl flex items-center justify-center';

function CashCard() {
  const api = useApi(getCash);
  const { openCash } = useCash();
  const w = api.ready ? api.data.wallet : null;
  const balance = w ? w.balancePaise / 100 : 0;
  const notRecorded = w ? w.notRecordedPaise / 100 : 0;
  return (
    <article className="home-card p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`${ICON} bg-emerald-50 text-emerald-700`}><Banknote size={22} aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-[13px] text-slate-600">Cash wallet</p>
          <p className="tabular text-[22px] font-extrabold text-[#0b2545]" title={`Exact: ${exact(balance)}`}>{w ? rounded(balance) : '—'}</p>
          {notRecorded > 0 && <p className="text-[12px] text-amber-800">{rounded(notRecorded)} not recorded</p>}
        </div>
      </div>
      <button type="button" onClick={() => openCash()} className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#1d4ed8] text-white text-[14px] font-semibold hover:bg-[#1e40af]">
        <Plus size={16} aria-hidden="true" /> Cash
      </button>
    </article>
  );
}

export default function CashAndActions() {
  const { openCash } = useCash();
  return (
    <section className="home-in grid gap-3 sm:gap-4 lg:grid-cols-[minmax(280px,1fr)_2fr]" style={{ '--delay': '360ms' }} aria-label="Cash and quick actions">
      <CashCard />
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        <Link to="/statements" className={TILE}><span className={`${ICON} bg-blue-50 text-[#1d4ed8]`}><Upload size={22} aria-hidden="true" /></span>Upload</Link>
        <button type="button" onClick={() => openCash()} className={TILE}><span className={`${ICON} bg-emerald-50 text-emerald-700`}><Banknote size={22} aria-hidden="true" /></span>Cash</button>
        <Link to="/ask" className={TILE}><span className={`${ICON} bg-indigo-50 text-indigo-700`}><Sparkles size={22} aria-hidden="true" /></span>Ask</Link>
        <Link to="/goals" className={TILE}><span className={`${ICON} bg-amber-50 text-amber-700`}><Target size={22} aria-hidden="true" /></span>Goal</Link>
      </div>
    </section>
  );
}
