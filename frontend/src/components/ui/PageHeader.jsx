// A page title with at most one short plain line under it.

export default function PageHeader({ title, line, children }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-space-sm">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{title}</h1>
        {line && <p className="font-body-md text-body-md text-secondary">{line}</p>}
      </div>
      {children}
    </header>
  );
}
