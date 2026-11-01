// A chapter of the runway: an optional tag, the title and the content.
export default function Chapter({ n, id, title, tag, aside, children }) {
  return (
    <section id={id} className="relative scroll-mt-24 py-10 sm:py-14" aria-labelledby={`${id}-title`}>
      <div className="relative">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {tag && <p className="mb-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">{tag}</p>}
            <h2 id={`${id}-title`} className="max-w-3xl text-[26px] sm:text-[32px] font-extrabold leading-tight tracking-tight text-[#0b2545]">{title}</h2>
          </div>
          {aside}
        </header>
        {children}
      </div>
    </section>
  );
}
