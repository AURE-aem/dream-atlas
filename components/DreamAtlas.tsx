"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import DreamConnection, {
  getDreamConnectionPath,
} from "@/components/DreamConnection";
import DreamStar from "@/components/DreamStar";
import type { AtlasGraph } from "@/lib/atlas/graph";
import {
  ATLAS_MEMORY_OPEN_LINK_TEST_ID,
  ATLAS_MEMORY_PANEL_TEST_ID,
} from "@/lib/atlas/tour-contract.mjs";

type Props = {
  graph: AtlasGraph;
  selectedDreamId?: string;
  newDreamId?: string;
  initialQuery?: string;
};

type StarDepth = {
  layer: "far" | "middle" | "near";
  opacity: number;
  scale: number;
};

const ambientStars = Array.from({ length: 84 }, (_, index) => {
  const hash = (index * 9301 + 49297) % 233280;
  const secondHash = (index * 7919 + 104729) % 233280;
  const size = index % 29 === 0 ? 2.1 : index % 7 === 0 ? 1.25 : 0.65;
  return {
    left: `${(hash / 233280) * 100}%`,
    top: `${(secondHash / 233280) * 100}%`,
    size,
    opacity: 0.16 + ((index * 37) % 60) / 100,
    delay: `${-((index * 0.37) % 7)}s`,
    twinkles: index % 7 === 0,
  };
});

function getStarDepth(id: string): StarDepth {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  const value = (hash % 1000) / 1000;
  if (value < 0.28) {
    return { layer: "far", opacity: 0.48, scale: 0.7 };
  }
  if (value > 0.76) {
    return { layer: "near", opacity: 1, scale: 1.18 };
  }
  return { layer: "middle", opacity: 0.78, scale: 0.92 };
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export default function DreamAtlas({
  graph,
  selectedDreamId,
  newDreamId,
  initialQuery = "",
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const validSelectedId = graph.nodes.some(({ id }) => id === selectedDreamId)
    ? selectedDreamId ?? null
    : null;
  const validNewId = graph.nodes.some(({ id }) => id === newDreamId)
    ? newDreamId ?? null
    : null;
  const selectedRestingNodeId = validNewId ?? validSelectedId;
  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null);
  const restingNodeId = selectedRestingNodeId ?? pinnedNodeId;
  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    selectedRestingNodeId,
  );
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const ambientLayerRef = useRef<HTMLDivElement>(null);
  const atlasBoundsRef = useRef<DOMRect | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pointerTargetRef = useRef({ x: 0, y: 0 });

  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
      }
    },
    [],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const matchingNodes = useMemo(
    () =>
      normalizedQuery
        ? graph.nodes.filter(({ searchText }) =>
            searchText.includes(normalizedQuery),
          )
        : [],
    [graph.nodes, normalizedQuery],
  );
  const matchingIds = useMemo(
    () => new Set(matchingNodes.map(({ id }) => id)),
    [matchingNodes],
  );
  const nodesById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  );
  const activeNode = activeNodeId ? nodesById.get(activeNodeId) ?? null : null;

  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    const ids = new Set<string>([activeNodeId]);
    for (const edge of graph.edges) {
      if (edge.source === activeNodeId) ids.add(edge.target);
      if (edge.target === activeNodeId) ids.add(edge.source);
    }
    return ids;
  }, [activeNodeId, graph.edges]);

  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const edge of graph.edges) {
      counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
      counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
    }
    return counts;
  }, [graph.edges]);

  const atlasConnectionPath = useMemo(
    () =>
      graph.edges
        .map((edge) => {
          const source = nodesById.get(edge.source);
          const target = nodesById.get(edge.target);
          if (!source || !target) return "";
          return getDreamConnectionPath(edge, source, target);
        })
        .filter(Boolean)
        .join(" "),
    [graph.edges, nodesById],
  );

  const activeEdges = useMemo(
    () =>
      activeNodeId
        ? graph.edges.filter(
            (edge) =>
              edge.source === activeNodeId || edge.target === activeNodeId,
          )
            .sort(
              (first, second) =>
                second.strength - first.strength ||
                first.id.localeCompare(second.id),
            )
        : [],
    [activeNodeId, graph.edges],
  );

  function paintAmbientOffset() {
    pointerFrameRef.current = null;
    const layer = ambientLayerRef.current;
    if (!layer) return;
    const { x, y } = pointerTargetRef.current;
    layer.style.transform = `translate3d(${x * 18}px, ${y * 12}px, 0)`;
  }

  function scheduleAmbientOffset(x: number, y: number) {
    pointerTargetRef.current = { x, y };
    if (pointerFrameRef.current === null) {
      pointerFrameRef.current = requestAnimationFrame(paintAmbientOffset);
    }
  }

  function focusNode(id: string) {
    setPinnedNodeId(id);
    setActiveNodeId(id);
    document.getElementById(`atlas-star-${id}`)?.focus();
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-full min-h-[68svh] items-center justify-center px-8 text-center">
        <div className="max-w-md">
          <div className="atlas-birth-star mx-auto h-20 w-20" />
          <h2 className="mt-8 font-serif text-3xl text-white">
            Your sky is still waiting.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/45">
            Preserve your first dream and the opening star will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      className="group/atlas relative h-full min-h-[70svh] overflow-hidden lg:min-h-screen"
      aria-label="Interactive Dream Atlas"
      onPointerEnter={(event) => {
        atlasBoundsRef.current = event.currentTarget.getBoundingClientRect();
      }}
      onPointerMove={(event) => {
        if (prefersReducedMotion) return;
        const bounds =
          atlasBoundsRef.current ??
          event.currentTarget.getBoundingClientRect();
        scheduleAmbientOffset(
          (event.clientX - bounds.left) / bounds.width - 0.5,
          (event.clientY - bounds.top) / bounds.height - 0.5,
        );
      }}
      onPointerLeave={() => {
        atlasBoundsRef.current = null;
        scheduleAmbientOffset(0, 0);
      }}
    >
      <div
        ref={ambientLayerRef}
        className="atlas-ambient-layer pointer-events-none absolute -inset-6"
      >
        {ambientStars.map((star, index) => (
          <span
            key={index}
            className={`atlas-ambient-star absolute rounded-full bg-white${
              star.twinkles ? " atlas-ambient-star--twinkle" : ""
            }`}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: star.delay,
              boxShadow:
                star.size > 1
                  ? "0 0 8px rgba(226,232,240,.72)"
                  : "0 0 3px rgba(255,255,255,.35)",
            }}
          />
        ))}
      </div>

      <div
        className="absolute left-5 top-5 z-40 w-[min(23rem,calc(100%-2.5rem))] md:left-8 md:top-8 lg:top-24 lg:w-[min(23rem,calc(100%-4rem))]"
        data-testid="atlas-search-panel"
      >
        <label className="sr-only" htmlFor="atlas-search">
          Search dream memory
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-sm text-slate-200/45">
            ⌕
          </span>
          <input
            id="atlas-search"
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a memory, place, or motif"
            className="w-full border-b border-white/15 bg-transparent py-3 pl-6 pr-12 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-slate-100/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.18em] text-white/35 transition hover:text-white"
            >
              clear
            </button>
          )}
        </div>
        {normalizedQuery && (
          <div className="mt-3 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#050713]/80 p-2 shadow-2xl backdrop-blur-xl">
            {matchingNodes.length ? (
              matchingNodes.slice(0, 6).map((node) => (
                <button
                  key={node.id}
                  type="button"
                  data-testid="atlas-search-result"
                  data-dream-id={node.id}
                  onClick={() => focusNode(node.id)}
                  className="rounded-xl px-3 py-2 text-left text-xs text-white/60 transition hover:bg-white/[0.07] hover:text-white"
                >
                  {node.title}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-white/35">
                No memory answered this search.
              </p>
            )}
          </div>
        )}
      </div>

      <svg
        viewBox="0 0 1000 650"
        className="relative z-10 h-full min-h-[70svh] w-full lg:min-h-screen"
        role="img"
        aria-label="Dreams connected by recurring motifs and constellations"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="connectionGradient">
            <stop offset="0%" stopColor="rgba(186,230,253,0.65)" />
            <stop offset="52%" stopColor="rgba(216,180,254,0.58)" />
            <stop offset="100%" stopColor="rgba(226,232,240,0.6)" />
          </linearGradient>
          <linearGradient id="activeConnectionGradient">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="50%" stopColor="#f5f3ff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <radialGradient id="starGradient">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="40%" stopColor="#ede9fe" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </radialGradient>
          <radialGradient id="selectedStarGradient">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="42%" stopColor="#f8fafc" />
            <stop offset="78%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <radialGradient id="starHaloGradient">
            <stop offset="0%" stopColor="rgba(233,213,255,0.2)" />
            <stop offset="64%" stopColor="rgba(192,132,252,0.07)" />
            <stop offset="100%" stopColor="rgba(192,132,252,0)" />
          </radialGradient>
          <filter id="starGlow" x="-220%" y="-220%" width="440%" height="440%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="selectedGlow" x="-320%" y="-320%" width="640%" height="640%">
            <feGaussianBlur stdDeviation="11" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softLineGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="lineGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          className={`atlas-web-field${activeNodeId ? " atlas-web-field--quiet" : ""}`}
        >
          <path
            d={atlasConnectionPath}
            fill="none"
            stroke="url(#connectionGradient)"
            strokeWidth="2.2"
            strokeOpacity="0.18"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter="url(#softLineGlow)"
            className="atlas-web-glow"
          />
          <path
            d={atlasConnectionPath}
            fill="none"
            stroke="url(#connectionGradient)"
            strokeWidth="0.72"
            strokeOpacity="0.64"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter="url(#lineGlow)"
            className="atlas-web-core"
          />
          <path
            d={atlasConnectionPath}
            fill="none"
            stroke="rgba(224,231,255,.9)"
            strokeWidth="0.55"
            strokeOpacity="0.38"
            strokeLinecap="round"
            strokeDasharray="1 12"
            vectorEffect="non-scaling-stroke"
            className={
              prefersReducedMotion
                ? "atlas-web-glint"
                : "atlas-web-glint atlas-connection-flow"
            }
          />
        </g>

        {activeEdges.map((edge) => {
          const source = nodesById.get(edge.source);
          const target = nodesById.get(edge.target);
          if (!source || !target) return null;
          return (
            <DreamConnection
              key={edge.id}
              edge={edge}
              source={source}
              target={target}
              motionEnabled={!prefersReducedMotion}
            />
          );
        })}

        {graph.nodes.map((node) => {
          const depth = getStarDepth(node.id);
          const isActive = activeNodeId === node.id;
          const isSelected = validSelectedId === node.id;
          const isNew = validNewId === node.id;
          const isMatch = normalizedQuery ? matchingIds.has(node.id) : true;
          const isConnected =
            activeNodeId === null || connectedNodeIds.has(node.id);
          return (
            <g
              key={node.id}
              opacity={
                isSelected || isActive || isNew
                  ? 1
                  : isMatch
                    ? depth.opacity
                    : 0.1
              }
              style={{
                transition: "opacity 320ms ease",
              }}
            >
              <DreamStar
                node={node}
                active={isActive}
                selected={isSelected || isNew}
                isNew={isNew}
                connected={isConnected && isMatch}
                connectionCount={connectionCounts.get(node.id) ?? 0}
                depthScale={depth.scale}
                depthLayer={depth.layer}
                motionEnabled={
                  !prefersReducedMotion && (isActive || isSelected || isNew)
                }
                onEnter={() => setActiveNodeId(node.id)}
                onLeave={() => setActiveNodeId(restingNodeId)}
              />
            </g>
          );
        })}
      </svg>

      {activeNode && (
        <div
          className="absolute left-5 top-[calc(100svh-12rem)] z-30 max-h-[calc(100svh-8rem)] w-[min(22rem,calc(100%-2.5rem))] overflow-y-auto rounded-2xl border border-white/[0.07] bg-[#050713]/42 px-5 py-4 shadow-[0_18px_55px_rgba(0,0,0,.24)] backdrop-blur-md md:left-8 lg:fixed lg:bottom-8 lg:top-auto lg:w-[min(22rem,calc(100vw-4rem))]"
          data-testid={ATLAS_MEMORY_PANEL_TEST_ID}
          data-dream-id={activeNode.id}
          aria-label="Dream memory preview"
        >
          <p className="text-[9px] uppercase tracking-[0.26em] text-slate-200/55">
            {activeNode.id === validNewId
              ? "A new star in your Atlas"
              : activeNode.constellationNames[0] ?? "Memory in focus"}
          </p>
          <p className="mt-2 font-serif text-xl text-white">
            {activeNode.title}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/40">
            {formatDate(activeNode.createdAt)}
            {activeNode.symbols.length
              ? ` · ${activeNode.symbols.slice(0, 3).join(" · ")}`
              : ""}
          </p>
          <a
            href={`/dreams/${activeNode.id}`}
            data-testid={ATLAS_MEMORY_OPEN_LINK_TEST_ID}
            className="mt-4 inline-flex text-xs text-slate-100/75 transition hover:text-white"
          >
            Open Dream Memory <span className="ml-2">→</span>
          </a>
        </div>
      )}
    </section>
  );
}
