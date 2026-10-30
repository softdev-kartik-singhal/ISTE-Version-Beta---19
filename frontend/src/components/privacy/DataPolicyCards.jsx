// Privacy cards: what SmartGullak stores, never stores, and what the AI sees.
import { Cpu, EyeOff, Funnel, KeyRound, Lock, Trash } from 'lucide-react';

export default function DataPolicyCards({ maskedAccount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="space-y-space-md">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <Lock size={26} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface">What we store</h2>
            </div>
            <p className="mt-space-xs font-body-sm text-body-sm text-secondary leading-relaxed">
              Normalized transactions, masked account numbers (<span className="font-currency-sm text-currency-sm">{maskedAccount}</span>), user-defined
              category rules, and local audit hashes.
            </p>
          </div>
        </div>
        <div className="mt-space-lg pt-space-md bg-surface-container-low rounded-lg p-space-md space-y-space-xs">
          <div className="flex items-center gap-1.5 text-primary">
            <KeyRound size={18} />
            <span className="font-label-md text-label-md">Unique Client-Key At Rest</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Data blocks are encrypted using AES-256-GCM. We hold no backdoor or master derivation keys.</p>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="space-y-space-md">
          <div className="w-12 h-12 rounded-xl bg-error-container/30 flex items-center justify-center text-error">
            <Trash size={26} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface">What we never store</h2>
            </div>
            <p className="mt-space-xs font-body-sm text-body-sm text-secondary leading-relaxed">
              Raw statement PDFs or CSV files (parsed in-memory and permanently purged from server RAM immediately after reading), NetBanking passwords,
              OTPs, or CVVs.
            </p>
          </div>
        </div>
        <div className="mt-space-lg pt-space-md bg-surface-container-low rounded-lg p-space-md space-y-space-xs">
          <div className="flex items-center gap-1.5 text-error">
            <Cpu size={18} />
            <span className="font-label-md text-label-md">0ms Cold Persistence</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">In-memory buffers are flushed via crypto-shred protocol instantly post-ingestion.</p>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="space-y-space-md">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <EyeOff size={26} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface">What the AI sees</h2>
            </div>
            <p className="mt-space-xs font-body-sm text-body-sm text-secondary leading-relaxed">
              Only your isolated scenario question text and scrubbed merchant category names. Never your total net worth, account balances, account
              numbers, or full statement line items.
            </p>
          </div>
        </div>
        <div className="mt-space-lg pt-space-md bg-surface-container-low rounded-lg p-space-md space-y-space-xs">
          <div className="flex items-center gap-1.5 text-secondary">
            <Funnel size={18} />
            <span className="font-label-md text-label-md">Token Anonymization Layer</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">All outbound LLM requests strip personally identifiable financial parameters.</p>
        </div>
      </div>
    </div>
  );
}
