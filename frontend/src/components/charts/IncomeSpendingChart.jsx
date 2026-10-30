// Grouped bar chart of monthly inflow vs outflow; the current month uses the highlight colours.
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

export default function IncomeSpendingChart({ months }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={months} barGap={4} barCategoryGap="30%" margin={{ top: 24, right: 8, bottom: 0, left: 8 }}>
        <XAxis
          dataKey="month"
          axisLine={{ stroke: '#E3E8EF' }}
          tickLine={false}
          tick={({ x, y, payload, index }) => (
            <text
              x={x}
              y={y + 12}
              textAnchor="middle"
              fontSize={11}
              fontFamily="Inter"
              fontWeight={months[index].current ? 600 : 500}
              fill={months[index].current ? '#0037b0' : '#495f82'}
            >
              {payload.value}
            </text>
          )}
        />
        <Tooltip formatter={(v) => formatCurrency(v)} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="inflow" name="Inflow" maxBarSize={20} radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {months.map((m) => (
            <Cell key={m.month} fill={m.current ? '#1d4ed8' : '#0B2545'} />
          ))}
        </Bar>
        <Bar dataKey="outflow" name="Outflow" maxBarSize={20} radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {months.map((m) => (
            <Cell key={m.month} fill={m.current ? '#495f82' : '#c4c5d7'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
