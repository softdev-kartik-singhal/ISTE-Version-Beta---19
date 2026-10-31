// No goals yet: an empty gullak, an invitation, and four quick starters that prefill the new-goal sheet.
import Gullak from './Gullak';
import { tileByKey } from './goalKit';

const STARTERS = ['phone', 'trip', 'emergency', 'bike'];

export default function EmptyGoals({ onStart }) {
  return (
    <section className="goal-in overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2545] via-[#123a8a] to-[#1d4ed8] px-6 py-10 sm:py-14 text-center text-white shadow-lg" data-tour="plan-goals">
      <Gullak percent={0} className="mx-auto w-52 sm:w-60" />
      <h1 className="mt-3 text-[30px] sm:text-[36px] font-extrabold tracking-tight">Start your first goal</h1>
      <p className="mx-auto mt-2 max-w-md text-[16px] text-blue-100">Pick something you are saving for and watch the gullak fill up.</p>
      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {STARTERS.map((key) => {
          const tile = tileByKey(key);
          const Icon = tile.icon;
          return (
            <button key={key} type="button" onClick={() => onStart(tile)} className="flex flex-col items-center gap-2.5 rounded-2xl bg-white p-4 text-[#0b2545] shadow transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tile.tint}`}><Icon size={23} aria-hidden="true" /></span>
              <span className="text-[15px] font-semibold">{tile.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
