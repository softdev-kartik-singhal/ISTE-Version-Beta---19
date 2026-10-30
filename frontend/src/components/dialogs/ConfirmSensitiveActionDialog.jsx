// Modal that asks for password + SmartGullak card before Export, Delete or Replace card.
import Modal from '../ui/Modal';
import SensitiveActionPanel from '../privacy/SensitiveActionPanel';

export default function ConfirmSensitiveActionDialog({ action, busy, onClose, onConfirm, onLostCard }) {
  return (
    <Modal open={action !== null} onClose={onClose} overlayClass="bg-inverse-surface/40 p-space-md">
      {action && <SensitiveActionPanel action={action} busy={busy} onCancel={onClose} onConfirm={onConfirm} onLostCard={onLostCard} />}
    </Modal>
  );
}
