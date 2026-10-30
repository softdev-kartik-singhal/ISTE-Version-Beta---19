// One-row horizontal chart: predicted low–high range as a floating bar, with the actual outcome marked on it.
import { Bar, BarChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import OutcomeMarker from './OutcomeMarker';

export default function ForecastRangeBar({ low, high, actual, max, hit, tooltip }) {
  const data = [{ name: 'range', range: [low, high] }];
  return (
    <ResponsiveContainer width="100%" height={24}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis type="category" dataKey="name" hide />
        <Bar dataKey="range" fill="#dae2fd" barSize={8} radius={4} background={{ fill: '#eaedff', radius: 4 }} isAnimationActive={false} />
        <ReferenceDot x={actual} y="range" shape={(props) => <OutcomeMarker {...props} hit={hit} tooltip={tooltip} />} />
      </BarChart>
    </ResponsiveContainer>
  );
}
