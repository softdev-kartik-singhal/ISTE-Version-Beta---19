// Money Flow screen: Sankey of income -> accounts -> categories -> merchants, category drawer and insights.
import { useRef, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { getMoneyFlow } from '../services/api';
import PageState from '../components/ui/PageState';
import MoneyFlowHeader from '../components/moneyFlow/MoneyFlowHeader';
import SankeyCard from '../components/moneyFlow/SankeyCard';
import CategoryDrawer from '../components/moneyFlow/CategoryDrawer';
import FlowInsightCard from '../components/moneyFlow/FlowInsightCard';
import Toast from '../components/ui/Toast';
import { formatCurrency } from '../utils/formatCurrency';

export default function MoneyFlow() {
  const [compare, setCompare] = useState('avg3');
  const [topN, setTopN] = useState(5);
  const [category, setCategory] = useState(null); // category opened in the drawer (null = the biggest flexible one)
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [toast, showToast] = useToast();
  const sankeyRef = useRef(null);
  const api = useApi(() => getMoneyFlow(null, compare, topN, category), [compare, topN, category]);
  if (!api.ready) return <PageState state={api} />;
  const data = api.data;

  // A category node opens its breakdown in the drawer; other nodes just show their amount.
  function openNode(node) {
    if (node.id.startsWith('cat:')) {
      setCategory(node.name);
      setDrawerOpen(true);
    } else showToast(`${node.name}: ${formatCurrency(node.amount)} in ${data.monthLabel}`);
  }

  return (
    <main className="w-full pt-16 px-space-lg py-space-lg flex-1 bg-background">
      <div className="flex flex-col w-full">
        <MoneyFlowHeader
          monthLabel={data.monthLabel}
          compare={compare}
          topN={topN}
          onCompareChange={setCompare}
          onTopNChange={setTopN}
          onResetView={() => {
            setTopN(5);
            setCategory(null);
            setCompare('avg3');
            setDrawerOpen(true);
            showToast('View reset');
          }}
          onFullscreen={() => sankeyRef.current.requestFullscreen()}
        />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg items-start">
          <SankeyCard ref={sankeyRef} flow={data} onNodeClick={openNode} />
          {drawerOpen && data.selectedCategory && <CategoryDrawer detail={data.selectedCategory} onClose={() => setDrawerOpen(false)} />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          {data.insights.map((insight) => (
            <FlowInsightCard key={insight.label} insight={insight} />
          ))}
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
