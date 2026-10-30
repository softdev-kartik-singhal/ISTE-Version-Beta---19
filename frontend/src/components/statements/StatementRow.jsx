// One uploaded-statement row: file, upload time, period, record count, parse status and actions.
import { CircleAlert, CircleCheck, CircleX, FileText, LoaderCircle, ReceiptText, RotateCcw, Sheet, Trash2, TriangleAlert } from 'lucide-react';

export default function StatementRow({ file, onReupload, onDelete, onViewLogs }) {
  const rejected = file.status === 'rejected';
  const processing = file.status === 'processing';
  const FileIcon = rejected ? TriangleAlert : file.type === 'csv' ? Sheet : FileText;

  return (
    <tr className={`hover:bg-surface-container-low/40 transition-colors ${processing ? 'bg-surface-container-low/20' : ''}`}>
      <td className="py-3.5 px-space-lg">
        <div className="flex items-center gap-space-sm">
          <div className={`w-8 h-8 rounded flex items-center justify-center ${rejected ? 'bg-error-container/40 text-error' : 'bg-surface-container text-primary'}`}>
            <FileIcon size={20} />
          </div>
          <div>
            <span className="font-body-md text-body-md text-on-surface font-semibold block leading-tight">{file.name}</span>
            <span className="font-label-sm text-label-sm text-secondary">{file.meta}</span>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-space-md">
        <span className="font-body-sm text-body-sm text-on-surface block">{file.uploadedAt}</span>
        <span className="font-label-sm text-label-sm text-secondary">{file.source}</span>
      </td>
      <td className={`py-3.5 px-space-md font-currency-sm text-currency-sm ${file.period ? 'text-on-surface' : 'text-secondary'}`}>{file.period || 'Undetermined'}</td>
      <td
        className={`py-3.5 px-space-md font-currency-sm text-currency-sm ${
          processing ? 'text-secondary' : rejected ? 'text-secondary font-medium' : 'text-on-surface font-medium'
        }`}
      >
        {processing ? 'Analyzing...' : `${file.records} txns`}
      </td>
      <td className="py-3.5 px-space-md">
        {file.status === 'parsed' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
            <CircleCheck size={15} /> Parsed
          </span>
        )}
        {processing && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold animate-pulse">
            <LoaderCircle size={15} className="animate-spin" /> Extracting pages ({file.progress}%)
          </span>
        )}
        {rejected && (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
              <CircleAlert size={15} /> Rejected
            </span>
            <span className="block font-label-sm text-label-sm text-error leading-tight">{file.error}</span>
          </div>
        )}
      </td>
      <td className="py-3.5 px-space-lg text-right">
        <div className="flex items-center justify-end gap-1">
          {file.status === 'parsed' && (
            <>
              <button className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface" title="View extraction logs" onClick={onViewLogs}>
                <ReceiptText size={18} />
              </button>
              <button className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-error" title="Remove statement" onClick={onDelete}>
                <Trash2 size={18} />
              </button>
            </>
          )}
          {processing && (
            <button className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface" title="Cancel ingestion" onClick={onDelete}>
              <CircleX size={18} />
            </button>
          )}
          {rejected && (
            <>
              <button
                className="h-8 px-2.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm flex items-center gap-1 transition-colors"
                onClick={onReupload}
              >
                <RotateCcw size={16} />
                <span>Re-upload</span>
              </button>
              <button className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-error" title="Delete file" onClick={onDelete}>
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
