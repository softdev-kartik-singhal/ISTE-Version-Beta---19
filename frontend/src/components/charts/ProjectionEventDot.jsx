// Labelled marker for a cash event on the projection line: dark callout above income, white below expenses.

export default function ProjectionEventDot({ cx, cy, payload, index }) {
  if (!payload.event) return <g key={index} />;
  const income = payload.eventTone === 'income';
  const width = payload.event.length * 5.6 + 16;
  return (
    <g key={index} transform={`translate(${cx}, ${cy})`}>
      <circle r="4.5" fill={income ? '#1d4ed8' : '#ba1a1a'} />
      {income ? (
        <>
          <rect fill="#0B2545" height="24" rx="4" width={width} x={-width / 2} y="-36" />
          <text fill="#FFFFFF" fontFamily="Inter" fontSize="10" fontWeight="500" textAnchor="middle" y="-20">{payload.event}</text>
          <polygon fill="#0B2545" points="-4,-12 4,-12 0,-7" />
        </>
      ) : (
        <>
          <rect fill="#ffffff" stroke="#E3E8EF" height="24" rx="4" width={width} x={-width / 2} y="12" />
          <text fill="#ba1a1a" fontFamily="Inter" fontSize="10" fontWeight="500" textAnchor="middle" y="28">{payload.event}</text>
          <polygon fill="#ffffff" stroke="#E3E8EF" points="-4,12 4,12 0,7" />
        </>
      )}
    </g>
  );
}
