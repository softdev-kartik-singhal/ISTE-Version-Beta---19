// Horizontal progress bar: a rounded track with a filled portion sized by percent.

export default function ProgressBar({ percent, barClass = 'bg-primary', trackClass = 'bg-surface-container', heightClass = 'h-2.5' }) {
  return (
    <div className={`w-full ${trackClass} ${heightClass} rounded-full overflow-hidden`}>
      <div className={`${barClass} h-full rounded-full tour-fill-bar`} style={{ width: `${percent}%` }} />
    </div>
  );
}
