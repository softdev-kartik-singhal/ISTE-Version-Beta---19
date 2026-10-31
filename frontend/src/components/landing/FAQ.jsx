// FAQ: five short, honest answers in accordions (one open at a time).
import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from './Reveal';

const QUESTIONS = [
  { q: 'Is my data safe?', a: 'Statement files are deleted right after they are read, only the last 4 digits of account numbers are kept, and exporting or deleting your data needs both your password and a tap of your SmartGullak card. We never sell your data.' },
  { q: 'Do you need my bank password?', a: 'No. You download statements from your bank yourself and upload them. SmartGullak never asks for your net-banking login.' },
  { q: 'Which banks work?', a: 'Right now HDFC (CSV and PDF statements) and Kotak (CSV statements).' },
  { q: 'Is this investment advice?', a: 'No. SmartGullak does arithmetic on your own statements and suggests types of products to learn about. It does not recommend specific products. Talk to a qualified adviser before investing.' },
  { q: 'How accurate is it?', a: 'Answers are estimates from your past statements, shown as a range for low, normal and high income months. The Track Record page shows how past forecasts compared with what really happened.' },
];

function Item({ q, a, open, onToggle }) {
  const id = useId();
  return (
    <li className="border-b border-slate-200">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="w-full py-5 flex items-center justify-between gap-4 text-left text-[17px] font-semibold text-[#0b2545]">
        {q}
        <ChevronDown size={20} className={`shrink-0 text-slate-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={id} className={`accordion ${open ? 'is-open' : ''}`}>
        <div><p className="pb-5 text-[15px] leading-relaxed text-slate-600">{a}</p></div>
      </div>
    </li>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-24 bg-slate-50/70 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-5 lg:px-10">
        <Reveal className="text-center">
          <h2 className="text-[34px] sm:text-[40px] leading-tight font-bold tracking-tight text-[#0b2545]">Questions, answered</h2>
        </Reveal>
        <Reveal delay={100}>
          <ul className="mt-10">
            {QUESTIONS.map((item, i) => (
              <Item key={item.q} {...item} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
