// Recharts Sankey of money moving from income sources -> accounts -> categories -> merchants.
import { ResponsiveContainer, Sankey } from 'recharts';
import SankeyNode from './SankeyNode';
import SankeyLink from './SankeyLink';

export default function MoneyFlowSankey({ nodes, links, onNodeClick }) {
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
        node={<SankeyNode />}
        link={<SankeyLink />}
        onClick={(item, type) => type === 'node' && onNodeClick && onNodeClick(item.payload)}
      />
    </ResponsiveContainer>
  );
}
