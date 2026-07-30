import { memo } from "react";

import type { AtlasNode } from "@/lib/atlas/graph";

type Props = {
  node: AtlasNode;
  active: boolean;
  selected: boolean;
  connected: boolean;
  connectionCount: number;
  depthScale?: number;
  depthLayer?: "far" | "middle" | "near";
  isNew?: boolean;
  motionEnabled?: boolean;
  onEnter: () => void;
  onLeave: () => void;
};

function roundSvgValue(value: number) { return Math.round(value * 1000) / 1000; }

function DreamStar({ node, active, selected, connected, connectionCount, depthScale = 1, depthLayer = "middle", isNew = false, motionEnabled = true, onEnter, onLeave }: Props) {
  const dimmed = !active && !selected && !connected;
  const importance = Math.min(connectionCount, 6);
  const x = roundSvgValue(node.x); const y = roundSvgValue(node.y);
  const haloRadius = roundSvgValue((13 + importance * 1.35) * depthScale);
  const coreRadius = roundSvgValue((2.3 + importance * 0.18) * depthScale);
  const starScale = roundSvgValue((0.47 + importance * 0.024) * depthScale);
  const emphasized = active || selected;
  const displayedHaloRadius = roundSvgValue(emphasized ? haloRadius + (selected ? 4.5 : 3) : haloRadius);
  const displayedCoreRadius = roundSvgValue(emphasized ? coreRadius + 0.7 : coreRadius);
  const displayedStarScale = roundSvgValue(emphasized ? starScale + 0.07 : starScale);
  const badgeX = roundSvgValue(haloRadius * 0.72); const badgeY = roundSvgValue(-haloRadius * 0.72);
  const glowFilter = emphasized
    ? selected
      ? "url(#selectedGlow)"
      : "url(#starGlow)"
    : undefined;

  return (
    <a
      id={`atlas-star-${node.id}`}
      href={`/dreams/${node.id}`}
      aria-label={`Open dream: ${node.title}`}
      data-dream-id={node.id}
      data-connection-count={connectionCount}
      data-active={active ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      <g transform={`translate(${x}, ${y})`} className="cursor-pointer" opacity={dimmed ? 0.25 : 1}>
        {(selected || isNew) && <>
          <circle r={displayedHaloRadius + 11} fill="rgba(226,232,240,0.025)" filter="url(#selectedGlow)">{motionEnabled && <animate attributeName="opacity" values="0.24;0.06;0.24" dur={isNew ? "2.8s" : "4.8s"} repeatCount="indefinite" />}</circle>
          <circle r={displayedHaloRadius + 6} fill="none" stroke="rgba(226,232,240,0.66)" strokeWidth="0.75">{motionEnabled && <><animate attributeName="r" values={`${displayedHaloRadius + 4};${displayedHaloRadius + 9};${displayedHaloRadius + 4}`} dur={isNew ? "2.8s" : "4.8s"} repeatCount="indefinite" /><animate attributeName="opacity" values="0.68;0.1;0.68" dur={isNew ? "2.8s" : "4.8s"} repeatCount="indefinite" /></>}</circle>
        </>}
        <circle r={displayedHaloRadius} fill={selected ? "rgba(203,213,225,0.075)" : "url(#starHaloGradient)"} stroke={selected ? "rgba(241,245,249,0.76)" : active ? "rgba(233,213,255,0.82)" : "rgba(192,132,252,0.28)"} strokeWidth={selected ? 0.95 : active ? 1.05 : 0.65} filter={glowFilter}>
          {motionEnabled && <animate attributeName="r" values={`${displayedHaloRadius - 0.7};${displayedHaloRadius + 1.2};${displayedHaloRadius - 0.7}`} dur={active ? "2.8s" : "5.8s"} repeatCount="indefinite" />}
        </circle>
        <circle r={displayedCoreRadius} fill={selected ? "url(#selectedStarGradient)" : "url(#starGradient)"} filter={glowFilter} />
        <path d="M 0 -18 L 3 -4 L 16 0 L 3 4 L 0 18 L -3 4 L -16 0 L -3 -4 Z" fill={selected || isNew ? "#f8fafc" : "rgba(250,245,255,0.98)"} opacity={emphasized || isNew ? 1 : depthLayer === "far" ? 0.55 : 0.88} transform={`scale(${displayedStarScale})`}>{motionEnabled && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur={selected ? "18s" : depthLayer === "far" ? "38s" : "28s"} repeatCount="indefinite" additive="sum" />}</path>
        {connectionCount > 1 && emphasized && <g transform={`translate(${badgeX}, ${badgeY})`}><circle r="6.1" fill={selected ? "rgba(30,41,59,0.88)" : "rgba(20,16,39,0.84)"} stroke={selected ? "rgba(226,232,240,0.58)" : "rgba(233,213,255,0.42)"} strokeWidth="0.55" /><text textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,.82)" fontSize="6.4" fontWeight="500">{connectionCount}</text></g>}
      </g>
    </a>
  );
}

export default memo(DreamStar);
