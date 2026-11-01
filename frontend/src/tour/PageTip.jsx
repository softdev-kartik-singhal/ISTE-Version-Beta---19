// A small tip that slides in at the top of Ask or Goals the first time a user opens that page. Shown once per user.
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTour } from './tourContext';

export default function PageTip({ id, text }) {
  const { running, userKey } = useTour();
  const key = `sg_tip_${userKey}_${id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1'); // shown once: it counts as seen the moment it appears (or is skipped during the tour)
      if (!running) setVisible(true);
    } catch {
      /* storage blocked: just skip the tip */
    }
  }, [key, running]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
  }

  if (!visible) return null;
  return (
    <div className="tour-tip" role="status">
      <span>{text}</span>
      <button onClick={dismiss} aria-label="Dismiss tip"><X size={16} /></button>
    </div>
  );
}
