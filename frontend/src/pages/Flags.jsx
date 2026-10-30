// Flags screen: anomaly summary, filter tabs, the three flag cards and resolved history.
import { useState } from 'react';
import { CheckCheck, HardDrive, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getFlags } from '../services/api';
import DuplicateFlagCard from '../components/flags/DuplicateFlagCard';
import LargeSpendFlagCard from '../components/flags/LargeSpendFlagCard';
import NewMerchantFlagCard from '../components/flags/NewMerchantFlagCard';
import ResolvedFlags from '../components/flags/ResolvedFlags';

const CARD_COMPONENTS = { duplicate: DuplicateFlagCard, large: LargeSpendFlagCard, 'new-merchant': NewMerchantFlagCard };
const TAB_ACTIVE = 'px-3 py-1.5 rounded-md font-label-md text-label-md bg-surface-container-lowest text-on-surface shadow-sm font-semibold transition-all';
const TAB_IDLE = 'px-3 py-1.5 rounded-md font-label-md text-label-md text-secondary hover:text-on-surface transition-all';

export default function Flags() {
  const data = useApi(getFlags);
  const [filter, setFilter] = useState('all');
  const [allReviewed, setAllReviewed] = useState(false);
  if (!data) return null;

  const count = (type) => data.flags.filter((f) => f.type === type).length;
  const tabs = [
    { value: 'all', label: `All Flags (${data.flags.length})` },
    { value: 'duplicate', label: `Duplicates (${count('duplicate')})` },
    { value: 'large', label: `Unusual Amount (${count('large')})` },
    { value: 'new-merchant', label: `New Merchants (${count('new-merchant')})` },
  ];
  const stats = [
    { label: 'Active Flags', value: data.flags.length, cls: 'bg-surface-container-low', valueCls: 'text-tertiary' },
    { label: 'Duplicates', value: count('duplicate'), cls: 'bg-surface-container-low', valueCls: 'text-on-surface' },
    { label: 'Unusual Spend', value: count('large'), cls: 'bg-surface-container-low', valueCls: 'text-on-surface' },
    { label: 'New Merchants', value: count('new-merchant'), cls: 'bg-surface-container-low', valueCls: 'text-on-surface' },
    { label: 'Resolved (30d)', value: data.resolved.count, cls: 'bg-surface-container-high', valueCls: 'text-primary' },
  ];

  function markAllReviewed() {
    if (window.confirm(`Mark all ${data.flags.length} anomaly flags as intentional and reviewed?`)) setAllReviewed(true);
  }

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
                  SmartGullak detected {data.flags.length} transactions needing your review to ensure accurate cashflow models and guardrails.
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
                  <HardDrive size={16} /> Continuous {data.confidence} ML Classification Confidence
                </span>
                <span className="hidden sm:inline">• Rule base: ICICI, HDFC &amp; Kotak accounts</span>
              </div>
              <button
                className="text-label-sm font-label-md text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1"
                onClick={markAllReviewed}
                disabled={allReviewed}
              >
                {allReviewed ? (
                  'All items reviewed ✓'
                ) : (
                  <>
                    <CheckCheck size={16} /> Mark All As Reviewed
                  </>
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
              <span className="font-label-sm text-label-sm text-secondary">Sorted by: Urgency</span>
              <button className="p-1.5 rounded-md text-secondary hover:bg-surface-container-high transition-colors" title="Filter preferences">
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-space-md">
            {data.flags
              .filter((flag) => filter === 'all' || flag.type === filter)
              .map((flag) => {
                const Card = CARD_COMPONENTS[flag.type];
                return <Card key={flag.id} flag={flag} dimmed={allReviewed} />;
              })}
          </div>

          <ResolvedFlags resolved={data.resolved} />
        </div>
      </div>
    </main>
  );
}
