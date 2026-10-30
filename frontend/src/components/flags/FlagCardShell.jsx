// Shared frame for a flag card: accent bar, type badge, source, urgency tag, plain-words reason, details and actions.

export default function FlagCardShell({ accentClass, badge, source, tag, reasonIcon, reason, children, actions, aside, dimmed }) {
  return (
    <article
      className="group bg-surface-container-lowest rounded-xl shadow-sm transition-all hover:shadow-md overflow-hidden"
      style={dimmed ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
    >
      <div className={`h-1 w-full ${accentClass}`} />
      <div className="p-space-lg space-y-space-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-xs">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-md text-label-md font-semibold ${badge.className}`}>
              {badge.icon} {badge.label}
            </span>
            <span className="font-label-sm text-label-sm text-secondary">{source}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-label-sm ${tag.className}`}>{tag.label}</span>
          </div>
        </div>
        <div className="p-3 bg-surface-container-low rounded-lg flex items-start gap-space-xs">
          {reasonIcon}
          <p className="font-body-md text-body-md text-on-surface font-medium leading-snug">{reason}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">{children}</div>
        <div className="pt-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex flex-wrap items-center gap-space-xs">{actions}</div>
          {aside}
        </div>
      </div>
    </article>
  );
}
