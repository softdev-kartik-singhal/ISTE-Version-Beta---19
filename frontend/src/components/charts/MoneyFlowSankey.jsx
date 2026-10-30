// Recharts Sankey of money moving from income sources -> accounts -> categories -> merchants.
import { ResponsiveContainer, Sankey } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

// Node: coloured bar plus name and amount. The last column (depth 3) puts its label on the left so it stays inside the chart.
function FlowNode({ x, y, width, height, payload }) {
  if (payload.ghost) return <g />;
  const labelLeft = payload.depth === 3;
  const tx = labelLeft ? x - 8 : x + width + 8;
  const anchor = labelLeft ? 'end' : 'start';
  const midY = y + height / 2;
  return (
    <g>
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
        {payload.name}
      </text>
      <text x={tx} y={midY + 11} textAnchor={anchor} fontSize={11} fontFamily="IBM Plex Mono" fill="#747686">
        {formatCurrency(payload.amount)}
      </text>
    </g>
  );
}

// Link: curved ribbon tinted with the colour of the node it flows into.
function FlowLink({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload }) {
  if (payload.target.ghost) return <g />;
  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={payload.target.color}
      strokeOpacity={payload.target.selected || payload.source.selected ? 0.55 : 0.3}
      strokeWidth={Math.max(linkWidth, 1)}
    />
  );
}

export default function MoneyFlowSankey({ nodes, links }) {
  // Recharts moves any node without outgoing links to the last column. Categories with no merchants
  // (e.g. Rent) get an invisible pass-through node so they stay in the Categories column. Its value is
  // tiny so it takes no space in the Merchants column (the category bar is still sized by its inflow).
  const allNodes = [...nodes];
  const allLinks = [...links];
  nodes
    .filter((n) => n.column === 2 && !links.some((l) => l.from === n.id))
    .forEach((n) => {
      allNodes.push({ id: `${n.id}-ghost`, ghost: true });
      allLinks.push({ from: n.id, to: `${n.id}-ghost`, value: 1 });
    });

  // Recharts links use node indexes, our data uses ids.
  const index = Object.fromEntries(allNodes.map((n, i) => [n.id, i]));
  const data = {
    nodes: allNodes,
    links: allLinks.map((l) => ({ source: index[l.from], target: index[l.to], value: l.value })),
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Sankey
        data={data}
        nodeWidth={10}
        nodePadding={18}
        iterations={64}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        node={<FlowNode />}
        link={<FlowLink />}
      />
    </ResponsiveContainer>
  );
}
