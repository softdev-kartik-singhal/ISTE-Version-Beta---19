// "Your balance over the next 8 weeks": usual line over a shaded likely range, a "today" marker and the safety
// cushion. The axis is built from the same weekly numbers as the line, the range and the sentence below.
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactMoney, exact } from '../../utils/money';
import { useReducedMotion } from '../../hooks/useMotion';

function axisFor(low, high, cushion) {
  const showCushion = cushion >= low - (high - low); // only draw the cushion when it is near the range, else it squashes the chart
  const lo = showCushion ? Math.min(low, cushion) : low;
  const pad = Math.max((high - lo) * 0.15, 1000);
  const min = lo >= 0 ? Math.max(0, lo - pad) : lo - pad;
  const max = high + pad;
  const step = (max - min) / 4;
  return { showCushion, domain: [min, max], ticks: [0, 1, 2, 3, 4].map((k) => Math.round(min + k * step)) };
}

export default function BalanceForecast({ forecast }) {
  const reduced = useReducedMotion();
  if (!forecast) {
    return (
      <section className="home-card home-in p-6" style={{ '--delay': '540ms' }}>
        <h2 className="text-[18px] font-semibold text-[#0b2545]">Your balance over the next 8 weeks</h2>
        <p className="mt-3 text-[14px] text-slate-600">A forecast needs 3 complete months of statements.</p>
      </section>
    );
  }
  const axis = axisFor(forecast.low, forecast.high, forecast.cushion);
  return (
    <section className="home-card home-in p-5 sm:p-6 flex flex-col" style={{ '--delay': '540ms' }} aria-labelledby="forecast">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="forecast" className="text-[18px] font-semibold text-[#0b2545]">Your balance over the next 8 weeks</h2>
        <div className="flex items-center gap-3 text-[12px] text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#1d4ed8]" aria-hidden="true" /> Usual</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-2.5 rounded-sm bg-blue-200" aria-hidden="true" /> Likely range</span>
        </div>
      </div>
      <div className="mt-4 h-[230px]" role="img" aria-label={`Forecast: balance between ${exact(forecast.low)} and ${exact(forecast.high)} over the next 8 weeks`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecast.weeks} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="range-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={axis.domain} ticks={axis.ticks} tickFormatter={compactMoney} tickLine={false} axisLine={false} width={52} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip formatter={(v) => (Array.isArray(v) ? `${exact(v[0])} – ${exact(v[1])}` : exact(v))} labelStyle={{ color: '#0b2545' }} />
            <Area dataKey="range" name="Likely range" stroke="none" fill="url(#range-fill)" isAnimationActive={!reduced} animationDuration={800} />
            <Line dataKey="usual" name="Usual" type="monotone" stroke="#1d4ed8" strokeWidth={2.5} dot={false} isAnimationActive={!reduced} animationDuration={900} />
            <ReferenceLine x="Today" stroke="#0b2545" strokeDasharray="3 3" />
            {axis.showCushion && (
              <ReferenceLine y={forecast.cushion} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Your safety cushion', position: 'insideBottomRight', fill: '#b91c1c', fontSize: 11 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-[14px] text-slate-700">
        Your balance should stay between <strong className="tabular" title={exact(forecast.low)}>{compactMoney(forecast.low)}</strong> and{' '}
        <strong className="tabular" title={exact(forecast.high)}>{compactMoney(forecast.high)}</strong>
        {!axis.showCushion && <span className="text-slate-500"> — well above your {compactMoney(forecast.cushion)} safety cushion</span>}.
      </p>
    </section>
  );
}
