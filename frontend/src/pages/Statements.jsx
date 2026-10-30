// Statements screen: upload area, reconciliation summary, coverage/gap timeline and uploaded-file log.
import { useRef, useState } from 'react';
import { ArrowUpRight, Check, FlaskConical, Landmark, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getStatements } from '../services/api';
import UploadHero from '../components/statements/UploadHero';
import ReconciliationCard from '../components/statements/ReconciliationCard';
import CoverageTimeline from '../components/statements/CoverageTimeline';
import StatementTable from '../components/statements/StatementTable';

const DEMO_LABELS = {
  idle: { icon: <FlaskConical size={18} className="text-primary" />, text: 'Load demo data' },
  loading: { icon: <RefreshCw size={18} className="text-primary animate-spin" />, text: 'Loading test sets...' },
  done: { icon: <Check size={18} className="text-primary" />, text: 'Demo loaded' },
};

export default function Statements() {
  const data = useApi(getStatements);
  const [demoState, setDemoState] = useState('idle');
  const fileInput = useRef(null);

  // Mirrors the design's demo feedback: loading -> loaded -> back to normal.
  function loadDemo() {
    setDemoState('loading');
    setTimeout(() => {
      setDemoState('done');
      setTimeout(() => setDemoState('idle'), 2000);
    }, 700);
  }

  if (!data) return null;
  const demo = DEMO_LABELS[demoState];

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <input ref={fileInput} accept=".pdf,.csv" className="hidden" multiple type="file" />
      <div className="flex flex-col w-full">
        <div className="w-full max-w-7xl mx-auto px-space-xl py-space-xl space-y-space-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Bank Statements &amp; Data Ingestion</h1>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Local Parsing Engine</span>
              </div>
              <p className="font-body-md text-body-md text-secondary max-w-3xl">
                Upload official PDF e-statements or CSV exports from your Indian bank accounts. Raw records are parsed on-device in your browser and
                automatically reconciled.
              </p>
            </div>
            <div className="flex items-center gap-space-md shrink-0">
              <button
                className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md flex items-center gap-2 shadow-sm"
                onClick={loadDemo}
              >
                {demo.icon}
                <span>{demo.text}</span>
              </button>
              <a className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1" href="#bank-guides">
                <span>Supported bank guides</span>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          <UploadHero onLoadDemo={loadDemo} onFilesChosen={() => {}} />
          <ReconciliationCard reconciliation={data.reconciliation} />
          <CoverageTimeline coverage={data.coverage} onUploadMissing={() => fileInput.current.click()} />
          <StatementTable
            files={data.files}
            totalTransactions={data.totalTransactions}
            institutions={data.institutions}
            onReupload={() => fileInput.current.click()}
          />

          <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md" id="bank-guides">
            <div className="flex items-start gap-space-md">
              <Landmark size={28} className="text-primary mt-0.5" />
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">How to download e-statements from Indian banks</h4>
                <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                  Log in to NetBanking for HDFC, ICICI, Kotak, Axis, or SBI. Choose &quot;Detailed Transaction Statement&quot;, select &quot;PDF&quot; or
                  &quot;CSV&quot;, and enter your standard NetBanking password when uploading if encrypted.
                </p>
              </div>
            </div>
            <button className="h-9 px-space-md rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors shrink-0 shadow-xs">
              Read 2-min export tutorial
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
