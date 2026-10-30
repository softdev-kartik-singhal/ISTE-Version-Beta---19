// Tiny trend line with a dot on the latest value (no axes), used in tables and banners.
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

export default function Sparkline({ values, color, strokeWidth = 2, showLastDot = true }) {
  const data = values.map((value, i) => ({ i, value }));
  const last = data.length - 1;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          isAnimationActive={false}
          dot={({ cx, cy, index }) =>
            showLastDot && index === last ? <circle key={index} cx={cx} cy={cy} r={2.5} fill={color} /> : <g key={index} />
          }
          activeDot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
