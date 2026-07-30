import type { GeneratedDream } from "@/types/dream";
import type {
  ConstellationNode,
  MemoryMatchKind,
  MemoryResult,
  TimelineGroup,
} from "./types";


const GENERIC_DREAM_TITLES = new Set([
  "the dream that waited",
  "untitled dream",
  "a remembered dream",
]);

const TITLE_STOP_WORDS = new Set([
  "about", "after", "again", "along", "also", "because", "before",
  "being", "could", "dream", "from", "have", "into", "just", "like",
  "there", "they", "this", "through", "very", "was", "were", "when",
  "where", "which", "while", "with", "would", "your",
]);

export function getDreamDisplayTitle(dream: GeneratedDream): string {
  const savedTitle = dream.title?.trim();
  if (savedTitle && !GENERIC_DREAM_TITLES.has(savedTitle.toLowerCase())) {
    return savedTitle;
  }

  const symbols = (dream.recurringSymbols ?? [])
    .map(({ symbol }) => symbol.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (symbols.length === 1) {
    return `The ${toTitleCase(symbols[0])}`;
  }

  if (symbols.length >= 2) {
    return `The ${toTitleCase(symbols[0])} and the ${toTitleCase(symbols[1])}`;
  }

  return (
    getTitleFromText(dream.originalDream) ||
    getTitleFromText(dream.narration) ||
    savedTitle ||
    "A Preserved Dream"
  );
}

function getTitleFromText(value?: string): string {
  const words = (value ?? "")
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !TITLE_STOP_WORDS.has(word.toLowerCase()))
    .slice(0, 5);

  return words.length > 0 ? toTitleCase(words.join(" ")) : "";
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());
}

export const matchLabels: Record<MemoryMatchKind, string> = {
  symbol: "Symbol match",
  title: "Title match",
  dream: "Dream match",
  reflection: "Reflection match",
  mention: "Mention",
};

export function rankDreams(
  dreams: GeneratedDream[],
  query: string,
): MemoryResult[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return dreams.map((dream) => ({ dream, score: 0, kinds: [] }));
  }

  return dreams
    .map((dream) => {
      const kinds: MemoryMatchKind[] = [];
      let score = 0;
      const title = getDreamDisplayTitle(dream).toLowerCase();
      const original = dream.originalDream?.toLowerCase() ?? "";
      const narration = dream.narration?.toLowerCase() ?? "";
      const observation = dream.observation?.toLowerCase() ?? "";
      const symbols =
        dream.recurringSymbols?.map(({ symbol }) =>
          symbol.toLowerCase(),
        ) ?? [];

      if (symbols.some((symbol) => symbol === normalized)) {
        kinds.push("symbol");
        score += 100;
      } else if (symbols.some((symbol) => symbol.includes(normalized))) {
        kinds.push("symbol");
        score += 80;
      }

      if (title.includes(normalized)) {
        kinds.push("title");
        score += 65;
      }
      if (original.includes(normalized)) {
        kinds.push("dream");
        score += 50;
      }
      if (observation.includes(normalized)) {
        kinds.push("reflection");
        score += 35;
      }
      if (narration.includes(normalized)) {
        kinds.push("mention");
        score += 20;
      }

      return { dream, score, kinds };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.dream.createdAt).getTime() -
          new Date(a.dream.createdAt).getTime(),
    );
}

export function groupTimeline(items: MemoryResult[]): TimelineGroup[] {
  const groups = new Map<string, MemoryResult[]>();

  for (const item of items) {
    const label = getTimelineGroupLabel(item.dream.createdAt);
    const current = groups.get(label) ?? [];
    current.push(item);
    groups.set(label, current);
  }

  return Array.from(groups.entries()).map(([label, groupedItems]) => ({
    label,
    items: groupedItems,
  }));
}

export function getTimelineGroupLabel(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const today = startOfDay(now);
  const target = startOfDay(date);
  const difference = Math.round(
    (today.getTime() - target.getTime()) / 86_400_000,
  );

  if (difference <= 0) return "Today";
  if (difference === 1) return "Yesterday";
  if (difference < 7) return "This week";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDreamTime(createdAt: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export function formatCompactDate(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function getDreamPreview(dream: GeneratedDream): string {
  return (
    dream.originalDream?.trim() ||
    dream.observation?.trim() ||
    dream.narration?.trim() ||
    "A preserved dream fragment."
  );
}

export function getSymbolEmoji(symbol: string): string {
  const normalized = symbol.trim().toLowerCase();
  const emojis: Record<string, string> = {
    water: "🌊",
    ocean: "🌊",
    sea: "🌊",
    river: "🌊",
    bridge: "🌉",
    door: "🚪",
    doors: "🚪",
    forest: "🌲",
    tree: "🌳",
    moon: "🌙",
    sun: "☀️",
    house: "⌂",
    home: "⌂",
    train: "◫",
    road: "⌁",
    path: "⌁",
    stairs: "⇅",
    mirror: "◇",
    bird: "◇",
    fire: "◈",
    mountain: "△",
    window: "□",
    rain: "⋰",
    cloud: "☁",
    room: "▣",
    key: "⚿",
    clock: "◷",
    shadow: "◐",
    light: "✦",
    darkness: "◐",
    depth: "≋",
  };
  return emojis[normalized] ?? "✦";
}

export function getSharedSymbols(
  a: GeneratedDream,
  b: GeneratedDream,
): string[] {
  const aSymbols = new Set(
    (a.recurringSymbols ?? []).map(({ symbol }) => symbol.toLowerCase()),
  );
  return (b.recurringSymbols ?? [])
    .map(({ symbol }) => symbol.toLowerCase())
    .filter((symbol) => aSymbols.has(symbol));
}

export function buildConstellation(
  dreams: GeneratedDream[],
  selectedDream: GeneratedDream | null,
  query: string,
): ConstellationNode[] {
  const positions: Array<[number, number]> = [
    [50, 14],
    [76, 24],
    [83, 49],
    [70, 72],
    [48, 84],
    [25, 69],
    [16, 43],
    [27, 22],
    [51, 48],
  ];
  const normalizedQuery = query.trim().toLowerCase();

  const ranked = [...dreams]
    .map((dream) => {
      const shared = selectedDream
        ? getSharedSymbols(selectedDream, dream).length
        : 0;
      const queryMatch = normalizedQuery
        ? [
            getDreamDisplayTitle(dream),
            dream.originalDream,
            dream.observation,
            dream.narration,
            ...(dream.recurringSymbols ?? []).map(({ symbol }) => symbol),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : false;
      return {
        dream,
        strength:
          dream.id === selectedDream?.id ? 10 : shared * 2 + (queryMatch ? 3 : 0),
      };
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, positions.length);

  return ranked.map((item, index) => ({
    ...item,
    x: positions[index][0],
    y: positions[index][1],
  }));
}

export function getEchoStats(
  dreams: GeneratedDream[],
  symbol: string,
): { count: number; firstSeen?: string; lastSeen?: string } {
  const normalized = symbol.toLowerCase();
  const matches = dreams.filter((dream) =>
    (dream.recurringSymbols ?? []).some(
      (item) => item.symbol.toLowerCase() === normalized,
    ),
  );
  const sorted = matches.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return {
    count: matches.length,
    firstSeen: sorted[0]?.createdAt,
    lastSeen: sorted[sorted.length - 1]?.createdAt,
  };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
