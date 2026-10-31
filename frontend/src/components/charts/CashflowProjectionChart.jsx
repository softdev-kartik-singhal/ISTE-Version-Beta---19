// 8-week balance projection: median line, variance band, runway buffer and labelled cash events.
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import ProjectionEventDot from './ProjectionEventDot';
import { formatCurrency } from '../../utils/formatCurrency';

const toLakh = (v) => v === 0 ? '₹0' : `${v < 0 ? '-' : ''}₹${Math.abs(v) >= 100000 ? `${(Math.abs(v) / 100000).toFixed(1)}L` : `${Math.round(Math.abs(v) / 1000)}k`}`;

// Axis range from the same weekly numbers the line, band and "lowest typical balance" label use, with the buffer in view.
function axisFor(weeks, runwayBuffer) {
  const lo = Math.min(runwayBuffer, ...weeks.map((w) => w.low));
  const hi = Math.max(runwayBuffer, ...weeks.map((w) => w.high));
  const pad = Math.max((hi - lo) * 0.1, 1000);
  const min = lo >= 0 ? Math.max(0, lo - pad) : lo - pad; // never dip below ₹0 when every balance is positive
  const step = (hi + pad - min) / 4;
  return { domain: [min, min + 4 * step], ticks: [0, 1, 2, 3, 4].map((k) => Math.round(min + k * step)) };
}

export default function CashflowProjectionChart({ weeks, runwayBuffer }) {
  const data = weeks.map((w) => ({ ...w, band: [w.low, w.high] }));
  const axis = axisFor(weeks, runwayBuffer);
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
          domain={axis.domain}
          ticks={axis.ticks}
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
          label={{ value: `Runway Buffer (${formatCurrency(runwayBuffer)})`, position: 'insideTopRight', fill: '#ba1a1a', fontSize: 10, fontWeight: 500 }}
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
