// Statements coverage timeline: one bar per account showing covered periods and missing gaps.
import CoverageAccountRow from './CoverageAccountRow';

export default function CoverageTimeline({ coverage, onUploadMissing }) {
  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-xl space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">Statement Coverage &amp; Gap Detection</h3>
            <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
              {coverage.gapCount} Gap Found
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
            Visual timeline of transaction continuity across your active accounts ({coverage.window})
          </p>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
            <span className="w-3 h-3 rounded-sm bg-secondary-fixed-dim" />
            <span>Covered (verified)</span>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary">
            <span className="w-3 h-3 rounded-sm bg-tertiary-fixed-dim" />
            <span>Missing gap</span>
          </div>
        </div>
      </div>
      <div className="space-y-space-lg">
        {coverage.accounts.map((account) => (
          <CoverageAccountRow key={account.code} account={account} onUploadMissing={onUploadMissing} />
        ))}
      </div>
    </section>
  );
}
