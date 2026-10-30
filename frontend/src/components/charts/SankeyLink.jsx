// Sankey link: curved ribbon tinted with the colour of the node it flows into.

export default function SankeyLink({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload }) {
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
