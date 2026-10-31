// "more than usual" / "less than usual" / "usual" tag: always an icon and words, colour is only extra.
import { ArrowDown, ArrowUp, Equal } from 'lucide-react';

const TAGS = {
  more: { icon: ArrowUp, text: 'more than usual', cls: 'bg-amber-100 text-amber-900' },
  less: { icon: ArrowDown, text: 'less than usual', cls: 'bg-emerald-100 text-emerald-900' },
  usual: { icon: Equal, text: 'usual', cls: 'bg-surface-container text-secondary' },
};

export default function CompareTag({ tag }) {
  if (!tag) return <span className="font-label-sm text-label-sm text-secondary">new</span>;
  const t = TAGS[tag];
  const Icon = t.icon;
  return (
    <span className={`self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm whitespace-nowrap ${t.cls}`}>
      <Icon size={12} /> {t.text}
    </span>
  );
}
