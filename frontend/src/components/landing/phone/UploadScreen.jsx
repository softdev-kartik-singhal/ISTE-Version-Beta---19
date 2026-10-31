// Phone screen for "How it works": two statement files drop in, then the merge summary counts up. Sample data.
import { FileText } from 'lucide-react';
import { useCountUp } from '../landingHooks';

const FILES = [
  { name: 'HDFC_Statement_Sep.pdf', meta: 'HDFC ••1234 · PDF' },
  { name: 'Kotak_Statement_Sep.csv', meta: 'Kotak ••5678 · CSV' },
];

export default function UploadScreen() {
  const merged = useCountUp(157, true, 1100);
  return (
    <div className="flex flex-col gap-3 text-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Statements</p>
      {FILES.map((f, i) => (
        <div key={f.name} className="drop-in flex items-center gap-2.5 rounded-xl bg-white border border-slate-200 shadow-sm p-2.5" style={{ '--delay': `${i * 250}ms` }}>
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
            <FileText size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate">{f.name}</p>
            <p className="text-[11px] text-slate-500">{f.meta}</p>
          </div>
        </div>
      ))}
      <div className="pop-in rounded-2xl bg-[#0b2545] text-white p-3 space-y-1.5" style={{ '--delay': '700ms' }}>
        <p className="text-[24px] font-bold leading-none">{merged}</p>
        <p className="text-[12px] text-blue-100">transactions merged</p>
        <ul className="pt-1 space-y-0.5 text-[12px] text-white/90">
          <li>· 3 duplicates removed</li>
          <li>· 2 transfers between your accounts ignored</li>
        </ul>
      </div>
    </div>
  );
}
