// Donut chart of spending by category with the total written in the centre.
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

export default function SpendingDonut({ categories, total }) {
  return (
    <div className="relative w-40 h-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categories}
            dataKey="amount"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            {categories.map((c) => (
              <Cell key={c.name} fill={c.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Total Spent</span>
        <span className="font-currency-md text-currency-md font-semibold text-on-surface">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
