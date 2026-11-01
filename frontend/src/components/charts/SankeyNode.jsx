// Sankey node: coloured bar plus name and amount; merchants (last column) are labelled on the left.
// Long names (a bank narration can be a whole line) are shortened with "…"; hovering shows the full name.
import { formatCurrency } from '../../utils/formatCurrency';

const MAX_LABEL = 22;
const shorten = (name) => (name.length > MAX_LABEL ? `${name.slice(0, MAX_LABEL - 1).trimEnd()}…` : name);

export default function SankeyNode({ x, y, width, height, payload }) {
  if (payload.ghost) return <g />;
  const labelLeft = payload.depth === 3;
  const tx = labelLeft ? x - 8 : x + width + 8;
  const anchor = labelLeft ? 'end' : 'start';
  const midY = y + height / 2;
  return (
    <g>
      <title>{`${payload.name}: ${formatCurrency(payload.amount)}`}</title>
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 2)}
        rx={2}
        fill={payload.color}
        stroke={payload.selected ? '#f59e0b' : 'none'}
        strokeWidth={payload.selected ? 3 : 0}
      />
      <text x={tx} y={midY - 3} textAnchor={anchor} fontSize={12} fontWeight={payload.selected ? 700 : 600} fill={payload.selected ? '#78350f' : '#131b2e'}>
        {shorten(payload.name)}
      </text>
      <text x={tx} y={midY + 11} textAnchor={anchor} fontSize={11} fontFamily="IBM Plex Mono" fill="#747686">
        {formatCurrency(payload.amount)}
      </text>
    </g>
  );
}
