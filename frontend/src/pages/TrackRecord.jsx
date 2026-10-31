// Track Record screen: forecast accuracy KPIs, range-vs-actual chart, integrity check, audit ledger and learning loop.
import { useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { downloadJson } from '../utils/download';
import Toast from '../components/ui/Toast';
import { getTrackRecord } from '../services/api';
import PageState from '../components/ui/PageState';
import VerifyLedgerButton from '../components/trackRecord/VerifyLedgerButton';
import TrackRecordKpis from '../components/trackRecord/TrackRecordKpis';
import ForecastComparison from '../components/trackRecord/ForecastComparison';
import IntegrityBanner from '../components/trackRecord/IntegrityBanner';
import AuditLedgerTable from '../components/trackRecord/AuditLedgerTable';
import LearningLoop from '../components/trackRecord/LearningLoop';

export default function TrackRecord() {
  const api = useApi(getTrackRecord);
  const [olderLoaded, setOlderLoaded] = useState(false);
  const [toast, showToast] = useToast();
  if (!api.ready) return <PageState state={api} />;
  const data = api.data;

  function exportProof() {
    const entries = olderLoaded ? [...data.ledger.entries, ...data.ledger.older] : data.ledger.entries;
    downloadJson('smartgullak-forecast-log.json', {
      entries: data.integrity.entries,
      headHash: data.integrity.headHash,
      generatedAt: new Date().toISOString(),
      leaves: entries.map((e) => ({ timestamp: e.timestamp, question: e.question, verdict: e.verdict, hash: e.hash })),
    });
    showToast('Forecast log exported');
  }

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="flex flex-col w-full">
        <div className="w-full max-w-[1400px] mx-auto p-space-lg space-y-space-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
                  <ShieldCheck size={14} />
                  <span>Hash-chained {data.version.replace('hash-chained ', '')}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-currency-sm text-label-sm">
                  {data.integrity.entries} entries
                </span>
              </div>
              <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">Track Record &amp; Model Veracity</h1>
              <p className="font-body-md text-body-md text-secondary max-w-3xl">
                Empirical audit of past cashflow predictions, range bounds, and ledger tamper verification. Real-time integrity proof against immutable
                financial histories.
              </p>
            </div>
            <div className="flex items-center gap-space-sm self-start md:self-auto">
              <VerifyLedgerButton entries={data.integrity.entries} />
              <button
                className="inline-flex items-center gap-1.5 h-10 px-space-md rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors shadow-sm"
                onClick={exportProof}
              >
                <Download size={18} />
                <span>Export Log Proof</span>
              </button>
            </div>
          </div>

          <TrackRecordKpis kpis={data.kpis} />

          {/* Key empirical finding */}
          <div className="rounded-xl bg-surface-container-low p-space-xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/5 pointer-events-none blur-3xl" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg relative z-10">
              <div className="space-y-space-sm max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-label-md text-label-md uppercase tracking-wider text-primary">Key Empirical Finding</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">{data.finding.headline}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{data.finding.detail}</p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[280px]">
                {data.finding.facts.map((fact) => (
                  <div key={fact.label} className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                    <span className="font-label-sm text-label-sm text-secondary block">{fact.label}</span>
                    <span className={`font-currency-md text-currency-md font-semibold ${fact.valueClass}`}>{fact.value}</span>
                    <span className="font-body-sm text-body-sm text-secondary block mt-0.5">{fact.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ForecastComparison months={data.forecasts} scaleMax={data.scaleMax} />
          <IntegrityBanner integrity={data.integrity} />
          <AuditLedgerTable
            ledger={data.ledger}
            olderLoaded={olderLoaded}
            onLoadEarlier={() => {
              setOlderLoaded(true);
              showToast(`Loaded ${data.ledger.older.length} earlier records`);
            }}
          />
          <LearningLoop learning={data.learning} />
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
