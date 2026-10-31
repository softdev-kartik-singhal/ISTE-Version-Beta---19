// "Needs Your Attention" card on the Dashboard: short list of flagged items with actions.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import Card from '../ui/Card';
import FormDialog from '../ui/FormDialog';
import Toast from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { iconFor } from '../../utils/icons';

export default function AttentionList({ attention }) {
  const [items, setItems] = useState(attention.items);
  const [dateDialogFor, setDateDialogFor] = useState(null);
  const [toast, showToast] = useToast();

  function dismiss(id) {
    setItems(items.filter((item) => item.id !== id));
    showToast('Alert dismissed');
  }

  function updateExpectedDate({ date }) {
    const label = new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    setItems(
      items.map((item) =>
        item.id === dateDialogFor ? { ...item, text: ['', item.text[1], ` invoice #INV-204 now expected on ${label}. Projection updated.`] } : item,
      ),
    );
    setDateDialogFor(null);
    showToast(`Expected date updated to ${label}`);
  }

  function secondary(item) {
    if (item.secondaryAction === 'Dismiss') return dismiss(item.id);
    setDateDialogFor(item.id);
  }

  return (
    <Card className="p-space-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Needs Your Attention</h3>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-white font-label-sm text-label-sm">{items.length} items</span>
          </div>
          <BellRing size={20} className="text-secondary" />
        </div>
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = iconFor(item.icon);
            const [before, highlight, after] = item.text;
            return (
              <div key={item.id} className="p-3.5 rounded-lg bg-surface-container-low border border-[#E3E8EF] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={item.iconClass} />
                    <span className="font-label-md text-label-md font-semibold text-on-surface">{item.title}</span>
                  </div>
                  <span className={`font-currency-sm text-currency-sm font-semibold ${item.amountClass}`}>{item.amount}</span>
                </div>
                <p className="font-body-sm text-body-sm text-secondary">
                  {before}
                  {highlight && <strong className="text-on-surface">{highlight}</strong>}
                  {after}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  {item.primaryAction.to ? (
                    <Link className="font-label-md text-label-md text-primary hover:underline" to={item.primaryAction.to}>
                      {item.primaryAction.label}
                    </Link>
                  ) : (
                    <button className="font-label-md text-label-md text-primary hover:underline" onClick={() => showToast('Reminder note sent to Acme Labs')}>
                      {item.primaryAction.label}
                    </button>
                  )}
                  {item.secondaryAction && (
                    <>
                      <span className="text-outline-variant">•</span>
                      <button className="font-label-md text-label-md text-secondary hover:text-on-surface" type="button" onClick={() => secondary(item)}>
                        {item.secondaryAction}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#E3E8EF] flex items-center justify-between text-label-sm text-secondary">
        <span>Audit log synced:</span>
        <span>{attention.auditSync}</span>
      </div>
      <FormDialog
        key={dateDialogFor || 'none'}
        open={dateDialogFor !== null}
        title="Update expected date"
        fields={[{ name: 'date', label: 'Expected payment date', type: 'date' }]}
        initialValues={{ date: '' }}
        submitLabel="Update"
        onClose={() => setDateDialogFor(null)}
        onSubmit={updateExpectedDate}
      />
      <Toast message={toast} />
    </Card>
  );
}
