// Generic small form dialog: renders the given fields and returns their values on submit.
import { useState } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';

const INPUT =
  'w-full h-10 px-3 rounded-lg bg-surface border border-[#E3E8EF] text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-container';

// fields: [{ name, label, type?, options?, placeholder? }]
export default function FormDialog({ open, title, fields, initialValues = {}, submitLabel = 'Save', onSubmit, onClose }) {
  const [values, setValues] = useState(initialValues);

  function submit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={submit} className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-space-lg flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          <button type="button" className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="px-space-lg pb-space-md flex flex-col gap-space-md">
          {fields.map((f) => (
            <label key={f.name} className="flex flex-col gap-1.5 font-label-md text-label-md text-on-surface font-semibold">
              {f.label}
              {f.options ? (
                <select className={INPUT} value={values[f.name] ?? ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={INPUT}
                  required
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
        <div className="p-space-lg bg-surface-container-low flex justify-end gap-space-sm">
          <button type="button" className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary">
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
