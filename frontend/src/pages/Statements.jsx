// Statements screen: upload area, reconciliation summary, coverage/gap timeline and uploaded-file log.
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, FlaskConical, Landmark, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { getStatements } from '../services/api';
import UploadHero from '../components/statements/UploadHero';
import ReconciliationCard from '../components/statements/ReconciliationCard';
import CoverageTimeline from '../components/statements/CoverageTimeline';
import StatementTable from '../components/statements/StatementTable';
import Toast from '../components/ui/Toast';

const DEMO_LABELS = {
  idle: { icon: <FlaskConical size={18} className="text-primary" />, text: 'Load demo data' },
  loading: { icon: <RefreshCw size={18} className="text-primary animate-spin" />, text: 'Loading test sets...' },
  done: { icon: <Check size={18} className="text-primary" />, text: 'Demo loaded' },
};
const BANKS = {
  hdfc: { name: 'HDFC Bank', last4: '8491' },
  icici: { name: 'ICICI Bank', last4: '4022' },
  kotak: { name: 'Kotak Mahindra', last4: '1190' },
};

// Guess the bank from the file name (e.g. "HDFC_Oct.pdf"); unknown banks are listed as "Other".
function describeFile(file) {
  const lower = file.name.toLowerCase();
  const bank = Object.keys(BANKS).find((b) => lower.includes(b)) || 'other';
  const size = file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  const info = BANKS[bank];
  return {
    id: `${file.name}-${Date.now()}-${Math.random()}`,
    name: file.name,
    bank,
    type: lower.endsWith('.csv') ? 'csv' : 'pdf',
    meta: info ? `${info.name} ··${info.last4} • ${size}` : `Other bank • ${size}`,
    uploadedAt: 'Just now',
    source: lower.endsWith('.csv') ? 'CSV import' : 'Manual upload',
    period: 'Detecting...',
    status: 'processing',
    progress: 0,
    sizeBytes: file.size,
  };
}

export default function Statements() {
  const data = useApi(getStatements);
  const [files, setFiles] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [demoState, setDemoState] = useState('idle');
  const [toast, showToast] = useToast();
  const fileInput = useRef(null);
  const uploadPurpose = useRef('new');

  useEffect(() => {
    if (data) {
      setFiles(data.files.map((f) => ({ ...f, id: f.name })));
      setCoverage(data.coverage);
    }
  }, [data]);

  if (!data || !files) return null;

  // Simulates on-device parsing: progress climbs to 100% and the row becomes "Parsed".
  function ingest(rows, { fillsGap = false } = {}) {
    setFiles((current) => [...rows, ...current]);
    rows.forEach((row) => {
      const timer = setInterval(() => {
        setFiles((current) =>
          current.map((f) => {
            if (f.id !== row.id) return f;
            const progress = Math.min(100, f.progress + 25);
            if (progress < 100) return { ...f, progress };
            clearInterval(timer);
            return { ...f, status: 'parsed', progress: 100, period: '01 Sep 2024 – 30 Sep 2024', records: Math.max(12, Math.round((f.sizeBytes || 400000) / 20000)) };
          }),
        );
      }, 400);
    });
    if (fillsGap) {
      setTimeout(() => {
        setCoverage((c) => ({
          ...c,
          gapCount: 0,
          accounts: c.accounts.map((a) =>
            a.segments.some((s) => s.gap) ? { ...a, segments: [], status: '100% continuous coverage (81 days)', txnCount: 148 + 112 + 31, end: '20 Oct 2024' } : a,
          ),
        }));
        showToast('Gap filled — HDFC coverage is now continuous');
      }, 1700);
    }
    showToast(`${rows.length} statement${rows.length === 1 ? '' : 's'} queued for local parsing`);
  }

  function chooseFiles(purpose) {
    uploadPurpose.current = purpose;
    fileInput.current.value = '';
    fileInput.current.click();
  }

  function onFilesPicked(list) {
    if (!list.length) return;
    const rows = list.map(describeFile);
    if (uploadPurpose.current.startsWith('replace:')) {
      const replacedId = uploadPurpose.current.slice('replace:'.length);
      setFiles((current) => current.filter((f) => f.id !== replacedId));
    }
    ingest(rows, { fillsGap: uploadPurpose.current === 'gap' });
  }

  // Mirrors the design's demo feedback and adds a sample HDFC + ICICI batch.
  function loadDemo() {
    setDemoState('loading');
    setTimeout(() => {
      ingest([
        describeFile({ name: 'HDFC_Sample_Sep2024.pdf', size: 1800000 }),
        describeFile({ name: 'ICICI_Sample_Sep2024.csv', size: 380000 }),
      ]);
      setDemoState('done');
      setTimeout(() => setDemoState('idle'), 2000);
    }, 700);
  }

  function removeFile(file) {
    if (file.status === 'parsed' && !window.confirm(`Remove ${file.name} and its transactions?`)) return;
    setFiles(files.filter((f) => f.id !== file.id));
    showToast(file.status === 'processing' ? `Cancelled ${file.name}` : `Removed ${file.name}`);
  }

  const parsed = files.filter((f) => f.status === 'parsed');
  const totalTransactions = parsed.reduce((s, f) => s + (f.records || 0), 0);
  const demo = DEMO_LABELS[demoState];

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <input ref={fileInput} accept=".pdf,.csv" className="hidden" multiple type="file" onChange={(e) => onFilesPicked(Array.from(e.target.files))} />
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
                disabled={demoState !== 'idle'}
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

          <UploadHero
            onLoadDemo={loadDemo}
            onChooseFiles={() => chooseFiles('new')}
            onDropFiles={(list) => {
              uploadPurpose.current = 'new';
              onFilesPicked(list);
            }}
          />
          <ReconciliationCard reconciliation={data.reconciliation} />
          <CoverageTimeline coverage={coverage} onUploadMissing={() => chooseFiles('gap')} />
          <StatementTable
            files={files}
            totalTransactions={totalTransactions}
            institutions={data.institutions}
            onReupload={(file) => chooseFiles(`replace:${file.id}`)}
            onDelete={removeFile}
            onViewLogs={(file) => showToast(`${file.name}: ${file.records} transactions extracted, 0 parsing warnings`)}
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
            <button
              className="h-9 px-space-md rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors shrink-0 shadow-xs"
              onClick={() => showToast('Tutorial: NetBanking → Accounts → Statement → pick dates → Download PDF/CSV → upload here')}
            >
              Read 2-min export tutorial
            </button>
          </div>
        </div>
      </div>
      <Toast message={toast} />
    </main>
  );
}
