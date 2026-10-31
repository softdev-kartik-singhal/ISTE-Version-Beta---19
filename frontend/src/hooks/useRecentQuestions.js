// The last few questions someone asked, remembered in this browser only (nothing is sent anywhere).
// Reads and writes are wrapped in try/catch: private windows and blocked storage just mean an empty list.
import { useCallback, useState } from 'react';

const KEY = 'sg_recent_questions';
const KEEP = 3;

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.slice(0, KEEP) : [];
  } catch {
    return [];
  }
}

// item: { text, amount (₹), month ('2026-10'), state ('yes' | 'typical' | 'no') }
export function useRecentQuestions() {
  const [items, setItems] = useState(read);
  const remember = useCallback((item) => {
    const same = (x) => x.text === item.text && x.amount === item.amount && x.month === item.month;
    const next = [{ ...item, at: new Date().toISOString() }, ...read().filter((x) => !same(x))].slice(0, KEEP);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: the list just lives for this visit */
    }
    setItems(next);
  }, []);
  return [items, remember];
}
