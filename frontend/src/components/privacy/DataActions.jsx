// "Your Data & Exports" section with the Export and Delete buttons.
import { Database, Download, Shield, Trash2 } from 'lucide-react';

export default function DataActions({ onExport, onDelete }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-space-lg pb-space-lg">
        <div className="space-y-space-xs max-w-2xl">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-primary" />
            <h2 className="font-headline-md text-headline-md text-on-surface">Your Data &amp; Exports</h2>
          </div>
          <p className="font-body-md text-body-md text-secondary">
            Download your raw financial graphs at any time in open formats, or trigger an absolute revocation of all tenant storage instances.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-md">
          <button
            className="h-10 px-space-md bg-surface-container-lowest hover:bg-surface-container-low text-on-surface rounded-lg font-label-md text-label-md flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            onClick={onExport}
          >
            <Download size={18} />
            <span>Export my data</span>
          </button>
          <button
            className="h-10 px-space-md bg-error hover:bg-error/90 text-on-error rounded-lg font-label-md text-label-md flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            onClick={onDelete}
          >
            <Trash2 size={18} />
            <span>Delete all my data</span>
          </button>
        </div>
      </div>
      <div className="bg-surface-container-low p-space-md rounded-lg flex items-start sm:items-center gap-space-md">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <Shield size={20} />
        </div>
        <div className="flex-1">
          <p className="font-body-sm text-body-sm text-on-surface font-medium">Two-Tier Hardware Protection Active</p>
          <p className="font-label-sm text-label-sm text-secondary">For your safety, exporting and deleting need your password and your SmartGullak hardware card.</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-surface-container text-primary font-currency-sm text-label-sm font-semibold tracking-wide flex-shrink-0">SECURE PROTOCOL v2.4</span>
      </div>
    </div>
  );
}
