// Statements screen: upload area, reconciliation summary, coverage/gap timeline and uploaded-file log.
import { useRef, useState } from 'react';
import { ArrowUpRight, Check, FlaskConical, Landmark, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { deleteStatement, getStatements, loadDemoData, uploadStatement } from '../services/api';
import PageState from '../components/ui/PageState';
import WithdrawalPrompt from '../cash/WithdrawalPrompt';
import UploadHero from '../components/statements/UploadHero';
import ReconciliationCard from '../components/statements/ReconciliationCard';
import CoverageTimeline from '../components/statements/CoverageTimeline';
import StatementTable from '../components/statements/StatementTable';
import Toast from '../components/ui/Toast';

const DEMO_LABELS = {
  idle: { icon: <FlaskConical size={18} className="text-primary" />, text: 'Load demo data' },
  loading: { icon: <RefreshCw size={18} className="text-primary animate-spin" />, text: 'Loading demo statements...' },
  done: { icon: <Check size={18} className="text-primary" />, text: 'Demo loaded' },
};

export default function Statements() {
  const api = useApi(getStatements);
  const [uploading, setUploading] = useState([]); // files being read by the server right now
  const [demoState, setDemoState] = useState('idle');
  const [toast, showToast] = useToast();
  const fileInput = useRef(null);
  const replacing = useRef(null); // id of the statement the next upload should replace

  if (!api.ready) return <PageState state={api} />;
  const data = api.data;

  // Sends each file to the server; the page refreshes itself when a file is done.
  async function onFilesPicked(list) {
    const replaceId = replacing.current;
    replacing.current = null;
    for (const file of list) {
      const row = {
        id: `uploading-${file.name}-${Date.now()}`, name: file.name, bank: 'other', type: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'pdf',
        meta: 'Reading file...', uploadedAt: 'Just now', source: 'Upload', period: 'Detecting...', status: 'processing', progress: 50,
      };
      setUploading((u) => [row, ...u]);
      try {
        const result = await uploadStatement(file);
        showToast(`${file.name}: ${result.newRows} new, ${result.duplicateRows} already imported`);
        if (replaceId) await deleteStatement(replaceId);
      } catch (err) {
        showToast(`Couldn’t read ${file.name}: ${err.message}`);
      }
      setUploading((u) => u.filter((x) => x.id !== row.id));
    }
  }

  function chooseFiles(replaceId = null) {
    replacing.current = replaceId;
    fileInput.current.value = '';
    fileInput.current.click();
  }

  // Loads the planted demo statements for this account only. It never adds on top of existing statements:
  // if there are some, the user is asked whether to replace them.
  async function loadDemo() {
    setDemoState('loading');
    try {
      let result;
      try {
        result = await loadDemoData();
      } catch (err) {
        if (err.code !== 'HAS_STATEMENTS') throw err;
        if (!window.confirm('You already have statements. Replace all of them with the demo data? Your current statements and their transactions will be removed.')) {
          setDemoState('idle');
          return;
        }
        result = await loadDemoData({ replace: true });
      }
      const added = result.files.filter((f) => f.status === 'imported').length;
      showToast(result.replaced ? `Statements replaced with the demo data (${added} files)` : `Demo statements loaded (${added} files)`);
      setDemoState('done');
    } catch (err) {
      showToast(err.message);
      setDemoState('idle');
      return;
    }
    setTimeout(() => setDemoState('idle'), 2000);
  }

  async function removeFile(file) {
    if (!window.confirm(`Remove ${file.name} and its transactions?`)) return;
    try {
      await deleteStatement(file.id);
      showToast(`Removed ${file.name}`);
    } catch (err) {
      showToast(err.message);
    }
  }

  const files = [...uploading, ...data.files];
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
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Read once, never stored</span>
              </div>
              <p className="font-body-md text-body-md text-secondary max-w-3xl">
                Upload official PDF e-statements or CSV exports from your Indian bank accounts. Each file is read once, turned into transactions and discarded; only the last 4 digits of
                account numbers are kept. Overlaps and transfers between your accounts are reconciled automatically.
              </p>
            </div>
            <div className="flex items-center gap-space-md shrink-0">
              <button
                className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md flex items-center gap-2 shadow-sm"
                onClick={loadDemo}
                data-tour="demo-btn"
                data-state={demoState}
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

          <WithdrawalPrompt />
          <UploadHero
            onLoadDemo={loadDemo}
            onChooseFiles={() => chooseFiles()}
            onDropFiles={onFilesPicked}
          />
          {data.files.length > 0 && (
            <>
              <ReconciliationCard reconciliation={data.reconciliation} />
              <CoverageTimeline coverage={data.coverage} onUploadMissing={() => chooseFiles()} />
            </>
          )}
          <StatementTable
            files={files}
            totalTransactions={data.totalTransactions}
            institutions={data.institutions}
            onReupload={(file) => chooseFiles(file.id)}
            onDelete={removeFile}
            onViewLogs={(file) => showToast(`${file.name}: ${file.records} transactions in this file`)}
          />

          <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md" id="bank-guides">
            <div className="flex items-start gap-space-md">
              <Landmark size={28} className="text-primary mt-0.5" />
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">How to download e-statements from Indian banks</h4>
                <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                  Log in to NetBanking for HDFC or Kotak. Choose &quot;Detailed Transaction Statement&quot; and download it as &quot;CSV&quot; (or an HDFC &quot;PDF&quot;). Password-protected files are not supported yet.
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
