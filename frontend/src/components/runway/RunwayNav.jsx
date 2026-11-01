// A rail of the five chapters, pinned under the top bar. It scrolls sideways on phones and marks the chapter in view.
import { useEffect, useState } from 'react';

const CHAPTERS = [
  { id: 'emergency-fund', n: '01', label: 'Emergency fund' },
  { id: 'job-loss-planner', n: '02', label: 'If income stopped' },
  { id: 'put-to-work', n: '03', label: 'Put to work' },
  { id: 'split', n: '04', label: 'Split' },
  { id: 'suggestions', n: '05', label: 'Suggestions' },
];

export default function RunwayNav() {
  const [current, setCurrent] = useState(CHAPTERS[0].id);
  useEffect(() => {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      const best = [...seen.entries()].sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] > 0) setCurrent(best[0]);
    }, { rootMargin: '-20% 0px -50% 0px', threshold: [0, 0.1, 0.3, 0.6] });
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return (
    <nav aria-label="Chapters of the Surplus Plan" className="sticky top-16 z-30 -mx-4 border-b border-slate-200/80 bg-[#f6f8fc]/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <ol className="strip-scroll flex gap-1 overflow-x-auto py-2">
        {CHAPTERS.map((c) => (
          <li key={c.id} className="shrink-0">
            <a href={`#${c.id}`} aria-current={current === c.id ? 'true' : undefined}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition-colors ${current === c.id ? 'bg-[#0b2545] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className={`text-[12px] tabular-nums ${current === c.id ? 'text-blue-200' : 'text-slate-400'}`}>{c.n}</span> {c.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
