// 8-week balance projection: usual line, low-to-high band, safety buffer and labelled cash events.
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import ProjectionEventDot from './ProjectionEventDot';
import { formatCurrency } from '../../utils/formatCurrency';

const toLakh = (v) => `₹${(v / 100000).toFixed(1)}L`;

export default function CashflowProjectionChart({ weeks, runwayBuffer }) {
  const data = weeks.map((w) => ({ ...w, band: [w.low, w.high] }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 36, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="corridorGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#bfd5fe" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#eaedff" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E3E8EF" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: '#495f82', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[runwayBuffer - 30000, 350000]}
          ticks={[150000, 200000, 250000, 300000, 350000]}
          tickFormatter={toLakh}
          tick={{ fill: '#495f82', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <ReferenceLine
          y={runwayBuffer}
          stroke="#ba1a1a"
          strokeDasharray="4 4"
          strokeOpacity={0.6}
          label={{ value: `Safety buffer (${formatCurrency(runwayBuffer)})`, position: 'insideTopRight', fill: '#ba1a1a', fontSize: 10, fontWeight: 500 }}
        />
        <Area dataKey="band" stroke="none" fill="url(#corridorGradient)" isAnimationActive={false} />
        <Line
          dataKey="median"
          stroke="#0037b0"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={ProjectionEventDot}
          activeDot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
