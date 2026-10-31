// "Can't answer yet": shown ONLY when the backend says the statements are not enough. One sentence and one button.
import { Link } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';

export default function CantAnswer({ reason }) {
  return (
    <section className="ask-card ask-pop p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p className="flex items-start gap-3 text-[15px] text-slate-700">
        <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0"><CircleHelp size={20} aria-hidden="true" /></span>
        <span className="pt-1.5">I can&apos;t answer this yet. {reason}</span>
      </p>
      <Link to="/statements" className="shrink-0 px-5 py-2.5 rounded-xl bg-[#1d4ed8] text-white text-[14px] font-semibold text-center hover:bg-[#1e40af]">Upload 1 more month</Link>
    </section>
  );
}
