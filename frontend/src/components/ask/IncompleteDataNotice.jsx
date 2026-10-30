// Ask safeguard banner explaining when statements are too incomplete to give a verdict.
import { Link } from 'react-router-dom';
import { CircleHelp, CircleX, ExternalLink, TriangleAlert } from 'lucide-react';

const CHECK_TONES = {
  fail: { icon: CircleX, cls: 'text-error' },
  warn: { icon: CircleHelp, cls: 'text-amber-800' },
};

export default function IncompleteDataNotice({ checks }) {
  return (
    <div className="rounded-xl p-space-lg bg-surface-container-low/70 space-y-space-md">
      <div className="flex items-start gap-space-md">
        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
          <TriangleAlert size={22} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase font-semibold text-secondary tracking-wider">Notice: When Statements Are Incomplete</span>
            <span className="font-label-sm text-label-sm text-secondary">• System Safeguard Mode</span>
          </div>
          <h4 className="font-headline-sm text-headline-sm text-on-surface">&quot;I can&apos;t answer this reliably yet&quot;</h4>
          <p className="font-body-md text-body-md text-secondary">
            SmartGullak strictly suppresses definitive affordability verdicts when statement continuity drops below baseline thresholds. If
            statements show discontinuities, here is the safeguard checklist applied:
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
        {checks.map((check) => {
          const tone = CHECK_TONES[check.status];
          const Icon = tone.icon;
          return (
            <div key={check.title} className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm space-y-1.5">
              <div className={`flex items-center gap-2 font-body-sm text-body-sm font-semibold ${tone.cls}`}>
                <Icon size={18} />
                <span>{check.title}</span>
              </div>
              <p className="font-label-sm text-label-sm text-secondary">{check.detail}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-space-xs">
        <span className="font-label-sm text-label-sm text-secondary">
          Need help uploading? PDF statements with password hashes are decrypted locally on your device.
        </span>
        <Link
          to="/statements"
          className="px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface text-primary font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span>Upload missing statements in Statements tab</span>
          <ExternalLink size={16} />
        </Link>
      </div>
    </div>
  );
}
