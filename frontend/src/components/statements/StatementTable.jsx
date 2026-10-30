// Statements "Uploaded Statements" table with bank filter tabs and summary footer.
import { useState } from 'react';
import StatementRow from './StatementRow';

const TABS = [
  { value: 'all', label: 'All banks' },
  { value: 'hdfc', label: 'HDFC Bank' },
  { value: 'icici', label: 'ICICI Bank' },
  { value: 'kotak', label: 'Kotak' },
];

export default function StatementTable({ files, totalTransactions, institutions, onReupload }) {
  const [bank, setBank] = useState('all');
  const visible = bank === 'all' ? files : files.filter((f) => f.bank === bank);

  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
      <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">Uploaded Statements</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-medium">{files.length} files</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">Historical ingestion log and parsing statuses</p>
        </div>
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setBank(tab.value)}
              className={
                tab.value === bank
                  ? 'px-3 py-1.5 rounded-md font-label-md text-label-md bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                  : 'px-3 py-1.5 rounded-md font-label-md text-label-md text-secondary hover:text-on-surface transition-colors'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/70">
              <th className="py-3 px-space-lg font-label-md text-label-md text-secondary uppercase tracking-wider">File Name &amp; Bank</th>
              <th className="py-3 px-space-md font-label-md text-label-md text-secondary uppercase tracking-wider">Upload Timestamp</th>
              <th className="py-3 px-space-md font-label-md text-label-md text-secondary uppercase tracking-wider">Statement Period</th>
              <th className="py-3 px-space-md font-label-md text-label-md text-secondary uppercase tracking-wider">Records</th>
              <th className="py-3 px-space-md font-label-md text-label-md text-secondary uppercase tracking-wider">Status</th>
              <th className="py-3 px-space-lg font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-0">
            {visible.map((file) => (
              <StatementRow key={file.name} file={file} onReupload={onReupload} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-space-md bg-surface-container-low/40 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <span className="font-label-sm text-label-sm text-secondary">
          Showing {visible.length} of {files.length} statement records • Total parsed volume: {totalTransactions} transactions across {institutions}{' '}
          verified institutions
        </span>
        <div className="flex items-center gap-space-sm">
          <button className="px-3 py-1 rounded bg-surface-container-lowest text-secondary font-label-sm text-label-sm hover:text-on-surface disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1 rounded bg-surface-container-lowest text-secondary font-label-sm text-label-sm hover:text-on-surface disabled:opacity-50" disabled>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
