// Landing hardware section: the SmartGullak NFC card pitch with a card illustration.
import { Lock, MonitorSmartphone, Nfc, Shield } from 'lucide-react';

export default function NfcCardTeaser() {
  return (
    <section id="security" className="px-6 lg:px-12 py-space-2xl bg-surface-container-low scroll-mt-16">
      <div className="max-w-7xl mx-auto rounded-xl bg-inverse-surface text-inverse-on-surface p-8 lg:p-14 overflow-hidden relative shadow-xl">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-white/10 text-primary-fixed font-label-md text-label-md font-semibold">
              <Lock size={16} /> Hardware-Keyed Personal Finance
            </div>
            <h2 className="font-display-lg text-display-lg font-bold text-white tracking-tight">
              The SmartGullak NFC Card.
              <br /> Physical sovereignty over your financial decisions.
            </h2>
            <p className="font-body-lg text-body-lg text-inverse-on-surface/80 leading-relaxed max-w-xl">
              Software passwords can be compromised. With SmartGullak, critical operations — decrypting income vaults, releasing scenario reports, or
              wiping local logs — require touching your physical NFC key to your device.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-space-sm text-inverse-on-surface/90">
                <Nfc size={22} className="text-primary-fixed" />
                <span className="font-label-md text-label-md font-medium">Standard NTAG424 DNA Crypto</span>
              </div>
              <div className="flex items-center gap-space-sm text-inverse-on-surface/90">
                <MonitorSmartphone size={22} className="text-primary-fixed" />
                <span className="font-label-md text-label-md font-medium">Works with iPhone &amp; Android</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm aspect-[1.586/1] rounded-xl bg-gradient-to-tr from-[#001551] via-[#0037b0] to-[#1d4ed8] p-6 shadow-2xl flex flex-col justify-between text-white relative border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm font-bold tracking-tight">SmartGullak</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono tracking-widest uppercase">VAULT</span>
                </div>
                <Nfc size={28} className="opacity-80" />
              </div>
              <div className="space-y-1">
                <div className="font-currency-md text-currency-md font-mono tracking-widest text-white/90">•••• •••• •••• 7741</div>
                <p className="text-[11px] text-white/70 font-mono">ED25519 SECURE ENCLAVE HARDWARE KEY</p>
              </div>
              <div className="flex items-end justify-between text-xs">
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Vault Holder</p>
                  <p className="font-medium tracking-wide">PRIVATE SOVEREIGN ID</p>
                </div>
                <Shield size={24} className="text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
