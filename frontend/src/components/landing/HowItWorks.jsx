// How it works: three numbered steps joined by a line that draws itself as the section scrolls past.
import { useEffect, useRef, useState } from 'react';
import { MessageCircleQuestion, Shuffle, Upload } from 'lucide-react';
import Reveal from './Reveal';
import { PHONE_SPACE, useReducedMotion } from './landingHooks';

const STEPS = [
  { icon: Upload, title: 'Upload statements', text: 'Add your HDFC (CSV or PDF) and Kotak (CSV) statements. Files are read once, then deleted.' },
  { icon: Shuffle, title: 'We clean and merge them', text: 'Overlapping files, repeated rows and transfers between your own accounts are sorted out for you.' },
  { icon: MessageCircleQuestion, title: 'Ask anything', text: '"Can I afford this?" gets a clear answer, with every step of the working shown.' },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  // Line progress = how far the section has moved through the viewport (0 -> 1).
  useEffect(() => {
    if (reduced) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const p = (window.innerHeight * 0.8 - box.top) / (box.height * 0.8);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [reduced]);

  return (
    <section id="how-it-works" data-screen="upload" ref={ref} className="py-24 scroll-mt-16">
      <div className={`max-w-7xl mx-auto px-5 lg:px-10 ${PHONE_SPACE}`}>
        <Reveal className="max-w-xl">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#1d4ed8]">How it works</p>
          <h2 className="mt-2 text-[34px] sm:text-[40px] leading-tight font-bold tracking-tight text-[#0b2545]">From statements to an answer in three steps</h2>
        </Reveal>
        <ol className="relative mt-12 space-y-10">
          {/* the connecting line: grey track plus a blue part that grows with scroll */}
          <span className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-slate-200" aria-hidden="true" />
          <span className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-[#1d4ed8] origin-top" style={{ transform: `scaleY(${progress})` }} aria-hidden="true" />
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 120} className="relative flex gap-5">
              <span className={`relative z-10 w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-[20px] font-bold transition-colors duration-300 ${progress > i / 3 ? 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-600/30' : 'bg-white text-[#0b2545] border border-slate-200'}`}>
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className="text-[20px] font-semibold text-[#0b2545] flex items-center gap-2">
                  <Icon size={20} className="text-[#1d4ed8]" /> {title}
                </h3>
                <p className="mt-1.5 text-[16px] text-slate-600 max-w-lg">{text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
