// Round marker for the actual outcome on a forecast range bar: check when inside the range, "!" when it missed.

export default function OutcomeMarker({ cx, cy, hit, tooltip }) {
  return (
    <g transform={`translate(${cx}, ${cy})`} style={{ cursor: 'default' }}>
      <title>{tooltip}</title>
      <circle r="10" fill={hit ? '#0037b0' : '#7f2500'} />
      {hit ? (
        <path d="M-4 0 L-1 3 L4 -3" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <text y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">
          !
        </text>
      )}
    </g>
  );
}
