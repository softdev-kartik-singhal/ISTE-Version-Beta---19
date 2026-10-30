// Small 6-month bar chart with value labels; the latest month is highlighted in amber.
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis } from 'recharts';

export default function TrajectoryBars({ months }) {
  const last = months.length - 1;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={months} barCategoryGap={8} margin={{ top: 16, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={({ x, y, payload, index }) => (
            <text x={x} y={y + 10} textAnchor="middle" fontSize={10} fill={index === last ? '#78350f' : '#747686'} fontWeight={index === last ? 700 : 500}>
              {payload.value}
            </text>
          )}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {months.map((m, i) => (
            <Cell key={m.month} fill={i === last ? '#f59e0b' : '#dae2fd'} />
          ))}
          <LabelList
            dataKey="label"
            position="top"
            content={({ x, y, width, value, index }) => (
              <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fontFamily="IBM Plex Mono" fill={index === last ? '#92400e' : '#747686'} fontWeight={index === last ? 700 : 400}>
                {value}
              </text>
            )}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
