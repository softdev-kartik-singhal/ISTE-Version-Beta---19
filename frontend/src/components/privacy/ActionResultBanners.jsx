// Completion banners for export and delete; the most recent result is highlighted.
import { FileCheck, UserX } from 'lucide-react';

export default function ActionResultBanners({ exportFileName, exportSize, highlight }) {
  const glow = (type) => (highlight === type ? 'ring-2 ring-primary/40 scale-[1.02]' : '');
  return (
    <div className="space-y-space-md">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Feedback &amp; Completed Status Banners</h3>
        <span className="font-label-md text-label-md text-secondary">Triggered Post-Authentication</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <div className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between transition-all ${glow('export')}`}>
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <FileCheck size={22} />
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface font-semibold">Your export is ready</p>
              <p className="font-body-sm text-body-sm text-secondary">download started ({exportFileName})</p>
            </div>
          </div>
          <span className="font-currency-sm text-currency-sm text-secondary bg-surface-container-low px-2.5 py-1 rounded">{exportSize}</span>
        </div>
        <div className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between transition-all ${glow('delete')}`}>
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-error-container text-error flex items-center justify-center flex-shrink-0">
              <UserX size={22} />
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface font-semibold">All your data has been deleted</p>
              <p className="font-body-sm text-body-sm text-secondary">Session terminated. Cryptographic keys erased.</p>
            </div>
          </div>
          <span className="font-label-sm text-label-sm text-error bg-error-container/40 px-2.5 py-1 rounded font-semibold uppercase">Purged</span>
        </div>
      </div>
    </div>
  );
}
