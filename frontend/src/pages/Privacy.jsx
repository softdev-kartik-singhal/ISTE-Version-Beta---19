// Privacy & Data screen: storage policy, hardware card, export/delete behind password + card, and the action sandbox.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { deleteUserData, exportUserData, getPrivacy } from '../services/api';
import { registerCard } from '../services/cardReader';
import { downloadCsv } from '../utils/download';
import DataPolicyCards from '../components/privacy/DataPolicyCards';
import HardwareCardPanel from '../components/privacy/HardwareCardPanel';
import DataActions from '../components/privacy/DataActions';
import ActionSandbox from '../components/privacy/ActionSandbox';
import ActionResultBanners from '../components/privacy/ActionResultBanners';
import ConfirmSensitiveActionDialog from '../components/dialogs/ConfirmSensitiveActionDialog';
import Toast from '../components/ui/Toast';

export default function Privacy() {
  const data = useApi(getPrivacy);
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [action, setAction] = useState(null); // 'export' | 'delete' | 'replace' | null
  const [busy, setBusy] = useState(false);
  const [highlight, setHighlight] = useState(null);
  const [exportSize, setExportSize] = useState('2.4 MB');
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (data) setCard(data.card);
  }, [data]);

  if (!data) return null;

  function flash(type) {
    setHighlight(type);
    setTimeout(() => setHighlight(null), 1500);
  }

  // Runs after password + card are verified in the dialog.
  async function confirm() {
    setBusy(true);
    if (action === 'export') {
      const rows = await exportUserData();
      downloadCsv(data.exportFileName, rows);
      setExportSize(`${(JSON.stringify(rows).length / 1024).toFixed(1)} KB`);
      showToast('Your export is ready — download started');
      flash('export');
    } else if (action === 'delete') {
      await deleteUserData();
      showToast('All your data has been deleted. Signing you out...');
      flash('delete');
      setTimeout(() => navigate('/'), 1800);
    } else {
      const newCard = await registerCard();
      setCard({ ...data.card, last4: newCard.last4, added: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) });
      showToast(`New card •• ${newCard.last4} paired`);
    }
    setBusy(false);
    setAction(null);
  }

  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="flex flex-col w-full">
        <div className="max-w-[1440px] mx-auto w-full px-margin py-space-xl space-y-space-2xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
            <div className="space-y-space-xs max-w-3xl">
              <div className="flex items-center gap-space-xs">
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider">
                  Zero-Knowledge Architecture
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                <span className="text-secondary font-label-md text-label-md">Audit Trail #{data.auditTrail}</span>
              </div>
              <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">Privacy &amp; Data Governance</h1>
              <p className="font-body-lg text-body-lg text-secondary">
                Zero data monetisation. Hardware-grade user sovereignty. Client-side ephemeral processing.
              </p>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <ShieldCheck size={22} />
              </div>
              <div className="flex flex-col pr-space-sm">
                <span className="font-label-md text-label-md text-on-surface">Client Enclave Active</span>
                <span className="font-label-sm text-label-sm text-secondary">
                  Hardware Key linked: <span className="font-currency-sm text-currency-sm text-on-surface font-semibold">{data.hardwareKey}</span>
                </span>
              </div>
            </div>
          </div>

          <DataPolicyCards maskedAccount={data.maskedAccount} />
          <HardwareCardPanel
            card={card}
            onReplace={() => setAction('replace')}
            onRegister={() => setAction('replace')}
            onPreviewChange={(registered) => setCard(registered ? data.card : null)}
          />
          <DataActions
            onExport={() => (card ? setAction('export') : showToast('Register a SmartGullak card first'))}
            onDelete={() => (card ? setAction('delete') : showToast('Register a SmartGullak card first'))}
          />
          <ActionSandbox
            onPreviewConfirm={(mode) => {
              flash(mode);
              showToast(mode === 'export' ? 'Preview: export would start now' : 'Preview: data would be deleted now');
            }}
            onLostCard={() => showToast('Verification link sent to your registered email')}
          />
          <ActionResultBanners exportFileName={data.exportFileName} exportSize={exportSize} highlight={highlight} />
        </div>
      </div>
      <ConfirmSensitiveActionDialog
        action={action}
        busy={busy}
        onClose={() => !busy && setAction(null)}
        onConfirm={confirm}
        onLostCard={() => showToast('Verification link sent to your registered email')}
      />
      <Toast message={toast} />
    </main>
  );
}
