// An opened category: where the money went (merchants) and the last 6 months as simple bars.
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis } from 'recharts';
import { X } from 'lucide-react';
import Card from '../ui/Card';
import Amount from '../ui/Amount';
import InfoTip from '../ui/InfoTip';
import { compactMoney, rounded } from '../../utils/money';

export default function CategoryDetail({ category, merchants, onClose }) {
  return (
    <Card className="p-space-lg space-y-space-lg">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{category.name}</h2>
        <button type="button" aria-label="Close" className="p-2 rounded-lg text-secondary hover:bg-surface-container" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        <section className="space-y-2">
          <h3 className="font-label-md text-label-md text-secondary">Where it went</h3>
          {merchants.length === 0 && <p className="font-body-sm text-body-sm text-secondary">No payments found.</p>}
          <ul className="divide-y divide-[#E3E8EF]">
            {merchants.map((m) => (
              <li key={m.name} className="py-2 flex items-center justify-between gap-2 font-body-md text-body-md">
                <span className="text-on-surface">
                  {m.name} <span className="font-label-sm text-label-sm text-secondary">· {m.count}×</span>
                </span>
                <Amount value={m.amount} className="font-semibold text-on-surface" />
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <h3 className="font-label-md text-label-md text-secondary flex items-center gap-1">
            Last 6 months
            {category.usual != null && <InfoTip text={`Usual = the middle of the 3 months before: ${rounded(category.usual)}.`} />}
          </h3>
          <div className="h-48" role="img" aria-label={`${category.name} by month: ${category.history.map((h) => `${h.month} ${rounded(h.amount)}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={category.history} margin={{ top: 20, right: 4, bottom: 0, left: 4 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#495f82', fontSize: 12 }} />
                <Bar dataKey="amount" fill="#1d4ed8" radius={4} isAnimationActive={false}>
                  <LabelList dataKey="amount" position="top" formatter={compactMoney} style={{ fill: '#434655', fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </Card>
  );
}
