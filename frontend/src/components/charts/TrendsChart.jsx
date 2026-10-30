// Monthly inflow/outflow bars with the net-surplus line and a surplus badge above each month.
import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const toK = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v === 0 ? '₹0' : `₹${v / 1000}k`);
const surplusLabel = (v) => `${v < 0 ? '-' : '+'}₹${(Math.abs(v) / 1000).toFixed(1)}k`;

// Badge drawn above the inflow bar: red pill for deficit months, solid blue for the peak, light blue otherwise.
function SurplusBadge({ x, y, width, index, months }) {
  const m = months[index];
  const cx = x + width + 1;
  if (m.note) {
    return (
      <g transform={`translate(${cx - 69}, ${y - 34})`}>
        <rect fill="#ffdad6" height="24" rx="12" width="138" />
        <text fill="#93000a" fontSize="10" fontWeight="600" textAnchor="middle" x="69" y="16">{m.note}</text>
      </g>
    );
  }
  const peak = m.peak;
  const w = peak ? 70 : 60;
  return (
    <g transform={`translate(${cx - w / 2}, ${y - 28})`}>
      <rect fill={peak ? '#1d4ed8' : '#dce1ff'} height="20" rx="4" width={w} />
      <text fill={peak ? '#ffffff' : '#0037b0'} fontFamily="IBM Plex Mono" fontSize="11" fontWeight="600" textAnchor="middle" x={w / 2} y="14">
        {surplusLabel(m.surplus)}
        {peak ? ' ★' : ''}
      </text>
    </g>
  );
}

function SurplusDot({ cx, cy, payload, index }) {
  const deficit = payload.surplus < 0;
  return (
    <circle key={index} cx={cx} cy={cy} r={payload.peak ? 6 : 5} fill={deficit ? '#ba1a1a' : payload.peak ? '#1d4ed8' : '#0037b0'} stroke="#ffffff" strokeWidth={payload.peak ? 2.5 : 2} />
  );
}

export default function TrendsChart({ months }) {
  const deficitMonth = months.find((m) => m.surplus < 0);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={months} barGap={2} barCategoryGap="60%" margin={{ top: 40, right: 20, bottom: 10, left: 0 }}>
        <defs>
          <linearGradient id="primaryBarGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="outflowBarGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E3E8EF" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} tickLine={false} tick={{ fill: '#434655', fontSize: 12 }} />
        <YAxis
          domain={[-20000, 140000]}
          ticks={[0, 20000, 60000, 100000, 140000]}
          tickFormatter={toK}
          tick={{ fill: '#747686', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        {deficitMonth && <ReferenceLine x={deficitMonth.label} stroke="#ba1a1a" strokeDasharray="2 2" strokeWidth={1.5} />}
        <Bar dataKey="inflow" fill="url(#primaryBarGrad)" barSize={20} radius={3} isAnimationActive={false}>
          <LabelList dataKey="surplus" content={(props) => <SurplusBadge {...props} months={months} />} />
        </Bar>
        <Bar dataKey="outflow" fill="url(#outflowBarGrad)" barSize={20} radius={3} isAnimationActive={false} />
        <Line type="monotone" dataKey="surplus" stroke="#0037b0" strokeWidth={3} strokeLinecap="round" dot={SurplusDot} activeDot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
