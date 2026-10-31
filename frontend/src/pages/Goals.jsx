// Goals: a gullak that fills as you save. A hero (your goals at a glance), one card per goal, finished goals,
// two helpful nudges, and a three-step sheet for new goals. The server decides every status; this page only shows them.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { deleteGoal, getGoals, saveGoal } from '../services/api';
import PageTip from '../tour/PageTip';
import PageState from '../components/ui/PageState';
import Toast from '../components/ui/Toast';
import GoalsHero from '../components/goals/GoalsHero';
import GoalCard from '../components/goals/GoalCard';
import DoneCard from '../components/goals/DoneCard';
import Nudges from '../components/goals/Nudges';
import EmptyGoals from '../components/goals/EmptyGoals';
import CalcDrawer from '../components/goals/CalcDrawer';
import NewGoalSheet from '../components/goals/NewGoalSheet';
import { AddMoneyDialog, DeleteGoalDialog } from '../components/goals/GoalDialogs';
import '../components/goals/goals.css';

const CELEBRATED = 'sg_goals_celebrated';

// A short confetti burst the first time a goal reaches 100% (never again for the same goal, and none for reduced motion).
function celebrate(id) {
  try {
    const done = JSON.parse(localStorage.getItem(CELEBRATED) || '[]');
    if (done.includes(id)) return;
    localStorage.setItem(CELEBRATED, JSON.stringify([...done, id]));
  } catch {
    /* storage unavailable: celebrate anyway */
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  confetti({ particleCount: 110, spread: 75, startVelocity: 38, ticks: 140, origin: { y: 0.6 }, zIndex: 2000000000 });
}

export default function Goals() {
  const api = useApi(getGoals);
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null); // { goal?, preset? }
  const [adding, setAdding] = useState(null);
  const [calc, setCalc] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [toast, showToast] = useToast();

  if (!api.ready) return <PageState state={api} />;
  const { goals, view, nudges, totals } = api.data;
  const live = goals.filter((g) => g.statusCode !== 'funded');
  const done = goals.filter((g) => g.statusCode === 'funded');

  // The same body the server stores, with changed values on top.
  const asSave = (g, changes) => ({ id: g.id, name: g.rawName, target: g.target, saved: g.saved, date: g.targetDate, category: g.category, priority: g.priority, ...changes });

  async function saveFromSheet(values) {
    await saveGoal(values);
    showToast(values.id ? `Saved changes to ${values.name}` : `Goal created: ${values.name}`);
    setSheet(null);
  }

  async function addMoney(goal, amount) {
    const saved = Math.min(goal.target, goal.saved + amount);
    try {
      await saveGoal(asSave(goal, { saved }));
      showToast(`Added to ${goal.name}`);
      if (saved >= goal.target) celebrate(goal.id);
    } catch (err) {
      showToast(err.message);
    }
    setAdding(null);
  }

  async function markComplete(goal) {
    try {
      await saveGoal(asSave(goal, { saved: goal.target }));
      showToast(`${goal.name} is complete`);
      celebrate(goal.id);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function remove(goal) {
    try {
      await deleteGoal(goal.id);
      showToast(`Deleted ${goal.name}`);
    } catch (err) {
      showToast(err.message);
    }
    setRemoving(null);
  }

  const ask = (g) => navigate('/ask', { state: { question: `Can I afford ₹${Math.round(g.remaining)} for ${g.rawName} in ${g.monthsLeft} months?` } });

  return (
    <main className="relative min-h-screen bg-[#f5f7fb] pt-16 pb-24 font-['Inter',system-ui,sans-serif] lg:pb-10">
      <PageTip id="goals" text="Add a goal to see how many months it takes with your monthly leftover." />
      <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {goals.length === 0
          ? <EmptyGoals onStart={(tile) => setSheet({ preset: tile })} />
          : <GoalsHero goals={live} view={view} totals={totals} onNew={() => setSheet({})} />}

        <Nudges nudges={nudges} />

        {live.length > 0 && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Goals in progress">
            {live.map((g, i) => (
              <GoalCard
                key={g.id} goal={g} index={i}
                onAdd={() => setAdding(g)} onEdit={() => setSheet({ goal: g })} onCalc={() => setCalc(g)}
                onAsk={() => ask(g)} onComplete={() => markComplete(g)} onDelete={() => setRemoving(g)}
              />
            ))}
          </section>
        )}

        {done.length > 0 && (
          <section aria-labelledby="done-goals">
            <h2 id="done-goals" className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[#0b2545]"><Trophy size={19} className="text-amber-500" aria-hidden="true" /> Done</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {done.map((g, i) => <DoneCard key={g.id} goal={g} index={i} onDelete={() => setRemoving(g)} />)}
            </div>
          </section>
        )}
      </div>

      {sheet && <NewGoalSheet key={sheet.goal?.id || sheet.preset?.key || 'new'} goal={sheet.goal} preset={sheet.preset} onClose={() => setSheet(null)} onSave={saveFromSheet} />}
      {adding && <AddMoneyDialog goal={adding} onClose={() => setAdding(null)} onAdd={(amount) => addMoney(adding, amount)} />}
      {removing && <DeleteGoalDialog goal={removing} onClose={() => setRemoving(null)} onDelete={() => remove(removing)} />}
      {calc && <CalcDrawer goal={calc} view={view} onClose={() => setCalc(null)} />}
      <Toast message={toast} />
    </main>
  );
}
