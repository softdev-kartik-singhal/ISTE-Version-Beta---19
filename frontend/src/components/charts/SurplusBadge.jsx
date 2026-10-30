// Badge above a month's inflow bar: red pill for a deficit, solid blue for the peak, light blue otherwise.

const surplusLabel = (v) => `${v < 0 ? '-' : '+'}₹${(Math.abs(v) / 1000).toFixed(1)}k`;

export default function SurplusBadge({ x, y, width, index, months }) {
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
