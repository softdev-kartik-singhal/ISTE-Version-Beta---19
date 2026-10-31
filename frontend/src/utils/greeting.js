// "Good morning, Aditya" by time of day, using the first name only.

export function greeting(name, now = new Date()) {
  const hour = now.getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = (name || '').trim().split(/\s+/)[0];
  return first ? `${part}, ${first}` : part;
}
