// Gives a page a toast: call showToast('message') and render <Toast message={toast} />; it hides after 2.5s.
import { useRef, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  function showToast(message) {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2500);
  }

  return [toast, showToast];
}
