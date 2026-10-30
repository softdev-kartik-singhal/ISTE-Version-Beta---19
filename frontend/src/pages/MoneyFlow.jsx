// Money Flow screen: Sankey of income -> accounts -> categories -> merchants, category drawer and insights.
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getMoneyFlow } from '../services/api';
import MoneyFlowHeader from '../components/moneyFlow/MoneyFlowHeader';
import SankeyCard from '../components/moneyFlow/SankeyCard';
import CategoryDrawer from '../components/moneyFlow/CategoryDrawer';
import FlowInsightCard from '../components/moneyFlow/FlowInsightCard';

export default function MoneyFlow() {
  const [month] = useState('2024-10');
  const [compare, setCompare] = useState('avg3');
  const [topN, setTopN] = useState(5);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const data = useApi(() => getMoneyFlow(month, compare, topN), [month, compare, topN]);
  if (!data) return null;

  return (
    <main className="w-full pt-16 px-space-lg py-space-lg flex-1 bg-background">
      <div className="flex flex-col w-full">
        <MoneyFlowHeader
          monthLabel={data.monthLabel}
          compare={compare}
          topN={topN}
          onCompareChange={setCompare}
          onTopNChange={setTopN}
        />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg items-start">
          <SankeyCard flow={data} />
          {drawerOpen && <CategoryDrawer detail={data.selectedCategory} onClose={() => setDrawerOpen(false)} />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          {data.insights.map((insight) => (
            <FlowInsightCard key={insight.label} insight={insight} />
          ))}
        </div>
      </div>
    </main>
  );
}
