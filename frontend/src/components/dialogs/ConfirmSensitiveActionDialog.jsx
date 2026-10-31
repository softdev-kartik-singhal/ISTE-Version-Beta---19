// Modal that asks for password + SmartGullak card before Export, Delete or Replace card.
// 'register' (no card yet) skips those checks and just waits for the first tap.
import Modal from '../ui/Modal';
import SensitiveActionPanel from '../privacy/SensitiveActionPanel';
import RegisterCardPanel from '../privacy/RegisterCardPanel';

export default function ConfirmSensitiveActionDialog({ action, busy, onClose, onConfirm, onLostCard, onRegistered }) {
  return (
    <Modal open={action !== null} onClose={onClose} overlayClass="bg-inverse-surface/40 p-space-md">
      {action === 'register' && <RegisterCardPanel onCancel={onClose} onDone={onRegistered} />}
      {action && action !== 'register' && (
        <SensitiveActionPanel action={action} busy={busy} onCancel={onClose} onConfirm={onConfirm} onLostCard={onLostCard} />
      )}
    </Modal>
  );
}
