// Home card: cash in hand right now, and how much of it is not yet recorded, with a "Record it" shortcut.
import { Banknote, Info } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getCash } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { useCash } from './cashContext';
import CashButton from './CashButton';

const rupees = (paise) => formatCurrency(paise / 100);

export default function CashWalletCard() {
  const api = useApi(getCash);
  const { openCash } = useCash();
  if (!api.ready) return null; // the card is extra; no loader or error box on Home
  const w = api.data.wallet;

  return (
    <section className="rounded-xl bg-surface-container-lowest shadow-sm border border-[#E3E8EF] p-5 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-md">
        <div className="w-11 h-11 rounded-xl bg-secondary-fixed/60 text-primary flex items-center justify-center"><Banknote size={22} /></div>
        <div>
          <p className="font-label-md text-label-md uppercase tracking-wider text-secondary">Cash wallet</p>
          <p className="font-currency-hero text-[26px] leading-tight text-on-surface">{rupees(w.balancePaise)}</p>
          {w.balancePaise < 0 ? (
            <p className="font-body-sm text-body-sm text-secondary">You recorded {rupees(-w.balancePaise)} more than you withdrew. A withdrawal may be missing from your statements.</p>
          ) : w.notRecordedPaise > 0 ? (
            <p className="font-body-sm text-body-sm text-secondary">{rupees(w.notRecordedPaise)} not yet recorded</p>
          ) : (
            <p className="font-body-sm text-body-sm text-secondary">Record cash you spend or receive.</p>
          )}
          {w.countedAsSpendingPaise > 0 && (
            <p className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-0.5">
              <Info size={13} /> {rupees(w.countedAsSpendingPaise)} left over {w.unrecordedDays}+ days is counted as &quot;Cash — not recorded&quot;.
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        {w.notRecordedPaise > 0 && (
          <button className="h-10 px-space-md rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md" onClick={() => openCash({ amountPaise: w.notRecordedPaise })}>
            Record it
          </button>
        )}
        <CashButton className="hidden md:flex" />
      </div>
    </section>
  );
}
