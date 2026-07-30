import type { Constellation, GeneratedDream } from "@/types/dream";
import { getDreamDisplayTitle } from "@/components/memory/memoryUtils";

export type AtlasNode = {
  id: string;
  title: string;
  createdAt: string;
  x: number;
  y: number;
  symbols: string[];
  constellationIds: string[];
  constellationNames: string[];
  searchText: string;
};

export type AtlasEdge = {
  id: string;
  source: string;
  target: string;
  sharedSymbols: string[];
  constellationIds: string[];
  strength: number;
};

export type AtlasGraph = { nodes: AtlasNode[]; edges: AtlasEdge[] };

const WIDTH = 1000;
const HEIGHT = 650;
const PADDING_X = 95;
const PADDING_Y = 78;
const MIN_DISTANCE = 82;

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toLowerCase();
}

function getDreamSymbols(dream: GeneratedDream): string[] {
  return Array.from(new Set(
    dream.recurringSymbols
      .map((item) => normalizeSymbol(item.symbol ?? ""))
      .filter(Boolean),
  ));
}

function hashString(value: string, salt: number): number {
  let hash = 2166136261 ^ salt;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unitHash(value: string, salt: number): number {
  return hashString(value, salt) / 4294967295;
}

function buildNodePositions(ids: string[]): Map<string, { x: number; y: number }> {
  const placed: Array<{ x: number; y: number }> = [];
  const positions = new Map<string, { x: number; y: number }>();

  ids.forEach((id, index) => {
    const baseX = PADDING_X + unitHash(id, 17) * (WIDTH - PADDING_X * 2);
    const baseY = PADDING_Y + unitHash(id, 71) * (HEIGHT - PADDING_Y * 2);
    let chosen = { x: baseX, y: baseY };

    for (let attempt = 0; attempt < 36; attempt += 1) {
      const angle = unitHash(`${id}:${attempt}`, 101) * Math.PI * 2;
      const radius = attempt === 0 ? 0 : 24 + attempt * 10;
      const candidate = {
        x: Math.min(WIDTH - PADDING_X, Math.max(PADDING_X, baseX + Math.cos(angle) * radius)),
        y: Math.min(HEIGHT - PADDING_Y, Math.max(PADDING_Y, baseY + Math.sin(angle) * radius)),
      };
      const clear = placed.every((other) => Math.hypot(candidate.x - other.x, candidate.y - other.y) >= MIN_DISTANCE);
      chosen = candidate;
      if (clear) break;
    }

    const microOffset = (index % 3) * 0.01;
    chosen = { x: chosen.x + microOffset, y: chosen.y + microOffset };
    placed.push(chosen);
    positions.set(id, chosen);
  });

  return positions;
}

export function buildAtlasGraph(
  dreams: GeneratedDream[],
  constellations: Constellation[] = [],
): AtlasGraph {
  const positions = buildNodePositions(dreams.map((dream) => dream.id));
  const constellationIdsByDream = new Map<string, string[]>();
  const constellationNamesByDream = new Map<string, string[]>();
  for (const constellation of constellations) {
    for (const dreamId of constellation.dreamIds) {
      constellationIdsByDream.set(dreamId, [
        ...(constellationIdsByDream.get(dreamId) ?? []),
        constellation.id,
      ]);
      constellationNamesByDream.set(dreamId, [
        ...(constellationNamesByDream.get(dreamId) ?? []),
        constellation.name,
      ]);
    }
  }
  const nodes: AtlasNode[] = dreams.map((dream) => {
    const position = positions.get(dream.id) ?? { x: WIDTH / 2, y: HEIGHT / 2 };
    const symbols = getDreamSymbols(dream);
    const title = getDreamDisplayTitle(dream);
    return {
      id: dream.id,
      title,
      createdAt: dream.createdAt,
      x: position.x,
      y: position.y,
      symbols,
      constellationIds: constellationIdsByDream.get(dream.id) ?? [],
      constellationNames: constellationNamesByDream.get(dream.id) ?? [],
      searchText: [
        title,
        dream.originalDream,
        symbols.join(" "),
        (constellationNamesByDream.get(dream.id) ?? []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    };
  });

  const relatedDreamIdsByDream = new Map(
    dreams.map((dream) => [
      dream.id,
      new Set(dream.memoryContext?.relatedDreamIds ?? []),
    ]),
  );
  const edges: AtlasEdge[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const source = nodes[i];
      const target = nodes[j];
      const targetSymbols = new Set(target.symbols);
      const sharedSymbols = source.symbols.filter((symbol) => targetSymbols.has(symbol));
      const targetConstellations = new Set(target.constellationIds);
      const constellationIds = source.constellationIds.filter((id) =>
        targetConstellations.has(id),
      );
      const memoryLinked =
        relatedDreamIdsByDream.get(source.id)?.has(target.id) ||
        relatedDreamIdsByDream.get(target.id)?.has(source.id);
      if (
        sharedSymbols.length === 0 &&
        constellationIds.length === 0 &&
        !memoryLinked
      ) {
        continue;
      }
      edges.push({
        id: `${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        sharedSymbols,
        constellationIds,
        strength:
          sharedSymbols.length +
          constellationIds.length * 2 +
          (memoryLinked ? 1 : 0),
      });
    }
  }

  return { nodes, edges };
}
