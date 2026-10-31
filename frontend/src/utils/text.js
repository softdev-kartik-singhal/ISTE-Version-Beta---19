// Title Case for display: "new bike" -> "New Bike". Words that already have capitals ("iPhone", "EMI") are left alone.
export function titleCase(text) {
  return String(text || '').replace(/\S+/g, (word) => (word === word.toLowerCase() ? word.charAt(0).toUpperCase() + word.slice(1) : word));
}
