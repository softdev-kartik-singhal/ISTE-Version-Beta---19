// One account row in the coverage timeline: covered segments, gap highlight and upload action.
import { CircleCheck, TriangleAlert, Upload } from 'lucide-react';

export default function CoverageAccountRow({ account, onUploadMissing }) {
  const hasGap = account.segments.some((s) => s.gap);
  return (
    <div className="p-space-lg rounded-xl bg-surface-container-low space-y-space-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-space-sm">
          <div className="w-7 h-7 rounded bg-surface-container-lowest flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface shadow-xs">
            {account.code}
          </div>
          <span className="font-label-md text-label-md text-on-surface font-semibold">{account.name}</span>
          <span className="font-currency-sm text-currency-sm text-secondary font-mono">··{account.last4}</span>
        </div>
        <div className="flex items-center gap-space-sm">
          {hasGap ? (
            <>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <TriangleAlert size={14} /> {account.status}
              </span>
              <button
                className="h-8 px-space-md rounded bg-primary-container text-white hover:bg-primary font-label-sm text-label-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                onClick={onUploadMissing}
              >
                <Upload size={14} /> Upload missing statement
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-medium">
              <CircleCheck size={14} /> {account.status}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 pt-1">
        {hasGap ? (
          <>
            <div className="h-6 w-full rounded-md bg-surface-container overflow-hidden flex shadow-inner">
              {account.segments.map((s) =>
                s.gap ? (
                  <div key={s.label} className="h-full bg-tertiary-fixed-dim relative group flex items-center justify-center animate-pulse" style={{ width: `${s.percent}%` }}>
                    <span className="font-label-sm text-label-sm text-on-tertiary-fixed font-semibold tracking-tight">{s.label}</span>
                  </div>
                ) : (
                  <div
                    key={s.label}
                    className="h-full bg-secondary-fixed hover:bg-secondary-fixed-dim transition-colors relative group flex items-center justify-center"
                    style={{ width: `${s.percent}%` }}
                  >
                    <span className="font-label-sm text-label-sm text-on-secondary-fixed font-mono opacity-80 group-hover:opacity-100">{s.label}</span>
                  </div>
                ),
              )}
            </div>
            <div className="flex justify-between font-currency-sm text-currency-sm text-secondary px-0.5">
              <span>{account.start}</span>
              <span className="text-tertiary font-semibold">{account.gapNote}</span>
              <span>{account.end}</span>
            </div>
          </>
        ) : (
          <div className="h-6 w-full rounded-md bg-secondary-fixed overflow-hidden flex items-center justify-between px-space-md shadow-inner">
            <span className="font-label-sm text-label-sm text-on-secondary-fixed font-mono">{account.start}</span>
            <span className="font-label-sm text-label-sm text-on-secondary-fixed font-medium">
              Continuous data stream ({account.txnCount} txns recorded)
            </span>
            <span className="font-label-sm text-label-sm text-on-secondary-fixed font-mono">{account.end}</span>
          </div>
        )}
      </div>
    </div>
  );
}
