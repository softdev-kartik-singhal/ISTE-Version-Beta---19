// "How sure we are": a 3-segment meter and one plain reason. Words carry the meaning; colour is only a hint.

const TONE = { 3: 'bg-emerald-500', 2: 'bg-amber-500', 1: 'bg-red-500' };

export default function ConfidenceMeter({ confidence }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1 shrink-0" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`w-7 h-2 rounded-full ${i <= confidence.segments ? TONE[confidence.segments] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className="text-[13px] text-slate-700"><span className="sr-only">How sure we are: </span>{confidence.line}</p>
    </div>
  );
}
