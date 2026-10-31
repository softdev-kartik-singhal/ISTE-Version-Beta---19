// Spending ("Where did my money go?"): pick a month, see each category against usual, tap one for its details.
// Money Flow and the month-by-month trends stay available as links.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getSpending } from '../services/api';
import { merchantsFor } from '../services/simpleViews';
import PageState from '../components/ui/PageState';
import PageHeader from '../components/ui/PageHeader';
import MonthSwitcher from '../components/spending/MonthSwitcher';
import CategoryCard from '../components/spending/CategoryCard';
import CategoryDetail from '../components/spending/CategoryDetail';

const LINK = 'inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:underline';

export default function Spending() {
  const location = useLocation();
  const api = useApi(getSpending);
  const [month, setMonth] = useState(location.state?.month || null); // null = latest month
  const [open, setOpen] = useState(location.state?.category || null);

  if (!api.ready) return <PageState state={api} />;
  const data = api.data;
  const shown = data.byMonth[month] ? month : data.latest;
  const categories = data.byMonth[shown];
  const selected = categories.find((c) => c.name === open);

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="max-w-5xl mx-auto p-space-md lg:p-space-xl space-y-space-lg">
        <PageHeader title="Spending">
          <MonthSwitcher months={data.months} month={shown} onChange={setMonth} />
        </PageHeader>
        {selected && <CategoryDetail category={selected} merchants={merchantsFor(data.debits, shown, selected.name)} onClose={() => setOpen(null)} />}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-space-md">
          {categories.map((c) => (
            <CategoryCard key={c.name} category={c} selected={c.name === open} onSelect={() => setOpen(c.name === open ? null : c.name)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-space-lg">
          <Link to="/money-flow" className={LINK}>
            See the full picture <ArrowRight size={16} />
          </Link>
          <Link to="/trends" className={LINK}>
            Month by month <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
