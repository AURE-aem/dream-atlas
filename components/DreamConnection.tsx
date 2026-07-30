import { memo } from "react";

import type { AtlasEdge, AtlasNode } from "@/lib/atlas/graph";

type Props = {
  edge: AtlasEdge;
  source: AtlasNode;
  target: AtlasNode;
  motionEnabled: boolean;
};

export function getDreamConnectionPath(
  _edge: AtlasEdge,
  source: AtlasNode,
  target: AtlasNode,
): string {
  return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
}

function DreamConnection({
  edge,
  source,
  target,
  motionEnabled,
}: Props) {
  const path = getDreamConnectionPath(edge, source, target);
  const activeWidth = Math.min(1.85, 0.85 + edge.strength * 0.18);

  return (
    <g className="pointer-events-none">
      <path
        d={path}
        fill="none"
        stroke="url(#activeConnectionGradient)"
        strokeWidth={activeWidth + 3.5}
        strokeOpacity="0.28"
        strokeLinecap="round"
        filter="url(#softLineGlow)"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={path}
        fill="none"
        stroke="url(#activeConnectionGradient)"
        strokeWidth={activeWidth}
        strokeOpacity="0.96"
        strokeLinecap="round"
        filter="url(#lineGlow)"
        vectorEffect="non-scaling-stroke"
        className="atlas-active-thread transition-all duration-500"
      />
      <path
        d={path}
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.15"
        strokeOpacity="0.88"
        strokeLinecap="round"
        strokeDasharray="1 8"
        vectorEffect="non-scaling-stroke"
        className={motionEnabled ? "atlas-connection-flow" : undefined}
      />
    </g>
  );
}

export default memo(DreamConnection);
