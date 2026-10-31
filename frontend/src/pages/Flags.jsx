// Flags screen: anomaly summary, filter tabs, flag cards whose actions resolve them, and resolved history.
import { useState } from 'react';
import { CheckCheck, HardDrive, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { correctCategory, decideFlag, getCategories, getFlags } from '../services/api';
import PageState from '../components/ui/PageState';
import DuplicateFlagCard from '../components/flags/DuplicateFlagCard';
import LargeSpendFlagCard from '../components/flags/LargeSpendFlagCard';
import NewMerchantFlagCard from '../components/flags/NewMerchantFlagCard';
import ResolvedFlags from '../components/flags/ResolvedFlags';
import FormDialog from '../components/ui/FormDialog';
import Toast from '../components/ui/Toast';

const CARD_COMPONENTS = { duplicate: DuplicateFlagCard, large: LargeSpendFlagCard, 'new-merchant': NewMerchantFlagCard };
const URGENCY = { duplicate: 0, large: 1, 'new-merchant': 2 };
const TAB_ACTIVE = 'px-3 py-1.5 rounded-md font-label-md text-label-md bg-surface-container-lowest text-on-surface shadow-sm font-semibold transition-all';
const TAB_IDLE = 'px-3 py-1.5 rounded-md font-label-md text-label-md text-secondary hover:text-on-surface transition-all';

export default function Flags() {
  const api = useApi(getFlags);
  const categories = useApi(getCategories);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Urgency');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [categoryFor, setCategoryFor] = useState(null);
  const [toast, showToast] = useToast();

  if (!api.ready) return <PageState state={api} />;
  const data = api.data;
  const active = data.flags;
  const categoryNames = categories.ready ? categories.data.filter((c) => c.kind !== 'income').map((c) => c.name) : [];

  // Saves the user's decision on the server. Only "confirmed as a duplicate" counts as a duplicate; anything else is "fine as it is".
  async function resolve(flags, resolution) {
    const decision = resolution.startsWith('Confirmed as a duplicate') ? 'confirmed' : 'dismissed';
    try {
      for (const f of flags) await decideFlag(f.id, decision);
      showToast(flags.length === 1 ? `${flags[0].merchant}: ${resolution}` : `${flags.length} flags marked as reviewed`);
    } catch (err) {
      showToast(err.message);
    }
  }

  function markAllReviewed() {
    if (active.length && window.confirm(`Mark all ${active.length} anomaly flags as intentional and reviewed?`)) {
      resolve(active, 'Reviewed as intentional');
    }
  }

  async function recategorise(category) {
    const option = categories.data.find((c) => c.name === category);
    try {
      await correctCategory(categoryFor.transactionId, option.id, true);
      await resolve([categoryFor], `Recategorised to ${category}`);
    } catch (err) {
      showToast(err.message);
    }
    setCategoryFor(null);
  }

  const count = (type) => active.filter((f) => f.type === type).length;
  const tabs = [
    { value: 'all', label: `All Flags (${active.length})` },
    { value: 'duplicate', label: `Duplicates (${count('duplicate')})` },
    { value: 'large', label: `Unusual Amount (${count('large')})` },
    { value: 'new-merchant', label: `New Merchants (${count('new-merchant')})` },
  ];
  const stats = [
    { label: 'Active Flags', value: active.length, cls: 'bg-surface-container-low', valueCls: 'text-tertiary' },
    { label: 'Duplicates', value: count('duplicate'), cls: 'bg-surface-container-low', valueCls: 'text-on-surface' },
    { label: 'Unusual Spend', value: count('large'), cls: 'bg-surface-container-low', valueCls: 'text-on-surface' },
    { label: 'New Merchants', value: count('new-merchant'), cls: 'bg-surface-container-low', valueCls: 'text-on-surface' },
    { label: 'Resolved', value: data.resolved.count, cls: 'bg-surface-container-high', valueCls: 'text-primary' },
  ];
  const visible = active
    .filter((flag) => filter === 'all' || flag.type === filter)
    .sort((a, b) => (sortBy === 'Urgency' ? URGENCY[a.type] - URGENCY[b.type] : b.amount - a.amount));

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="flex flex-col w-full">
        <div className="w-full max-w-7xl mx-auto px-space-md md:px-space-xl py-space-lg space-y-space-lg">
          <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
              <div className="space-y-space-xs max-w-2xl">
                <div className="flex items-center gap-space-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container/10 text-tertiary font-label-md text-label-md">
                    <ShieldCheck size={14} /> Automated Guardrail Engine
                  </span>
                  <span className="text-secondary font-label-sm text-label-sm">• Real-time Ledger Audit</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Flags &amp; Anomalies</h1>
                <p className="font-body-md text-body-md text-secondary">
                  {active.length
                    ? `SmartGullak detected ${active.length} transaction${active.length === 1 ? '' : 's'} needing your review to ensure accurate cashflow models and guardrails.`
                    : 'All caught up — no transactions need your review right now.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-space-xs pt-space-xs lg:pt-0">
                {stats.map((s) => (
                  <div key={s.label} className={`px-3 py-2 rounded-lg ${s.cls} flex flex-col`}>
                    <span className="font-label-sm text-label-sm text-secondary">{s.label}</span>
                    <span className={`font-currency-md text-currency-md font-semibold ${s.valueCls}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-space-md pt-space-sm flex items-center justify-between text-secondary">
              <div className="flex items-center gap-space-sm text-label-sm font-label-sm">
                <span className="flex items-center gap-1 text-primary">
                  <HardDrive size={16} /> Rule-based checks on every statement
                </span>
                <span className="hidden sm:inline">• Rules: duplicates, unusual amounts, new merchants</span>
              </div>
              <button
                className="text-label-sm font-label-md text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1 disabled:opacity-60"
                onClick={markAllReviewed}
                disabled={!active.length}
              >
                {active.length ? (
                  <>
                    <CheckCheck size={16} /> Mark All As Reviewed
                  </>
                ) : (
                  'All items reviewed ✓'
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-lg">
              {tabs.map((tab) => (
                <button key={tab.value} className={tab.value === filter ? TAB_ACTIVE : TAB_IDLE} onClick={() => setFilter(tab.value)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm text-secondary">Sorted by: {sortBy}</span>
              <button
                className="p-1.5 rounded-md text-secondary hover:bg-surface-container-high transition-colors"
                title="Switch sort order"
                onClick={() => setSortBy(sortBy === 'Urgency' ? 'Amount' : 'Urgency')}
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-space-md">
            {visible.map((flag) => {
              const Card = CARD_COMPONENTS[flag.type];
              return (
                <Card
                  key={flag.id}
                  flag={flag}
                  onResolve={(resolution) => resolve([flag], resolution)}
                  onChangeCategory={() => setCategoryFor(flag)}
                />
              );
            })}
            {visible.length === 0 && (
              <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm text-center font-body-md text-body-md text-secondary">
                No open flags here. Resolved items are listed below.
              </div>
            )}
          </div>

          <ResolvedFlags resolved={data.resolved} open={historyOpen} onToggle={() => setHistoryOpen(!historyOpen)} />
        </div>
      </div>
      <FormDialog
        key={categoryFor?.id || 'none'}
        open={categoryFor !== null}
        title={`Change category for ${categoryFor?.merchant || ''}`}
        fields={[{ name: 'category', label: 'New category', options: categoryNames }]}
        initialValues={{ category: categoryNames[0] }}
        submitLabel="Recategorise"
        onClose={() => setCategoryFor(null)}
        onSubmit={({ category }) => recategorise(category)}
      />
      <Toast message={toast} />
    </main>
  );
}
