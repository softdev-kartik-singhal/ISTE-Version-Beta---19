// Dimmed full-screen overlay that centres a dialog; clicking the backdrop calls onClose.

export default function Modal({ open, onClose, overlayClass = 'bg-on-background/40', children }) {
  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClass} backdrop-blur-sm transition-opacity duration-200`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
