// Surplus Plan screen: emergency fund first, common options, and the monthly allocation simulator.
import { ExternalLink, Gavel, Info, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getSurplusPlan } from '../services/api';
import EmergencyFundStep from '../components/surplus/EmergencyFundStep';
import OptionCard from '../components/surplus/OptionCard';
import AllocationSimulator from '../components/surplus/AllocationSimulator';
import StewardshipFooter from '../components/surplus/StewardshipFooter';

export default function SurplusPlan() {
  const data = useApi(getSurplusPlan);
  if (!data) return null;

  return (
    <main className="w-full pt-16 px-space-lg py-space-lg flex-1 bg-background">
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-space-md mb-space-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                  Capital Architecture
                </span>
                <span className="font-currency-sm text-currency-sm text-on-surface-variant font-medium">| {data.fiscalYear}</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Surplus Plan</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Deterministic framework to allocate liquid monthly cashflow into safety buffers and long-term milestones.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Framework Mode</span>
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">{data.frameworkMode}</span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl text-on-surface shadow-sm">
            <Info size={20} className="text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 flex-1">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="font-semibold text-on-surface">Educational guidance based on your own numbers</strong> — not investment advice.
                SmartGullak does not recommend specific mutual fund schemes, stocks, or financial products.
              </p>
              <span className="font-label-sm text-label-sm text-primary font-medium shrink-0 flex items-center gap-1 cursor-pointer hover:underline">
                Compliance Charter <ExternalLink size={14} />
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-space-xl">
          <EmergencyFundStep fund={data.emergencyFund} />

          <section className="flex flex-col gap-space-md">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-space-sm">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider">Step 2</span>
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                  Once your emergency fund is ready, common options people consider
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Disciplined financial building blocks for subsequent surplus deployment. Strictly objective benchmarks — no sponsored products or
                return promises.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {data.options.map((option) => (
                <OptionCard key={option.title} option={option} />
              ))}
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <div className="flex items-center gap-2">
                <Gavel size={17} className="text-outline" />
                <span>Strictly neutral asset class mechanics. No product endorsements, affiliate commissions, or fixed return claims.</span>
              </div>
              <span className="hidden sm:inline font-currency-sm text-[11px] text-outline font-medium">Standardized Classification v2.4</span>
            </div>
          </section>

          <AllocationSimulator allocation={data.allocation} />
          <StewardshipFooter />
        </div>
      </div>
    </main>
  );
}
