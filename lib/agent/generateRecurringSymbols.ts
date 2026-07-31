import { runTextAgent } from "@/lib/agent/runTextAgent";
import type { RecurringSymbol } from "@/types/dream";

const SYMBOL_INSTRUCTIONS = `
You extract concrete visual motifs from one remembered dream so they can be
compared with motifs in other preserved memories.

Rules:
- Return valid JSON only.
- Return a JSON array.
- Each item must contain:
  - "symbol": a short lowercase English noun or noun phrase,
  - "family": a canonical motif family,
  - "count": how many times it explicitly appears in the supplied dream.

Family must describe a broader recurring motif shared across dreams.

Examples:

river -> water
lake -> water
ocean -> water
sea -> water
rain -> water

fox -> animal
wolf -> animal
dog -> animal
cat -> animal
bird -> animal

moon -> night sky
stars -> night sky
constellation -> night sky
planet -> night sky
northern lights -> night sky

android -> machine
robot -> machine
computer -> machine

forest -> nature
tree -> nature
garden -> nature

locked door -> building
house -> building
window -> building

Do not simply repeat the symbol as the family if a broader motif exists.

Return at most 5 items.

Example:

[
  {
    "symbol": "river",
    "family": "water",
    "count": 1
  }
]
`.trim();

const CANONICAL_FAMILIES: Record<string, string> = {
  water: "water",
  river: "water",
  lake: "water",
  ocean: "water",
  sea: "water",
  rain: "water",
  flood: "water",
  wave: "water",
  shore: "water",

  animal: "animal",
  fox: "animal",
  wolf: "animal",
  dog: "animal",
  cat: "animal",
  bird: "animal",
  horse: "animal",
  sheep: "animal",

  moon: "night sky",
  star: "night sky",
  stars: "night sky",
  constellation: "night sky",
  constellations: "night sky",
  galaxy: "night sky",
  planet: "night sky",
  sky: "night sky",
  "northern lights": "night sky",

  android: "machine",
  androids: "machine",
  robot: "machine",
  robots: "machine",
  computer: "machine",
  machine: "machine",
  circuit: "machine",

  forest: "nature",
  tree: "nature",
  trees: "nature",
  garden: "nature",
  mountain: "nature",

  door: "building",
  house: "building",
  window: "building",
  room: "building",
  corridor: "building",
  
};

function canonicalFamily(
  symbol: string,
  family?: string,
): string {
  const normalizedSymbol = symbol.trim().toLowerCase();
  const normalizedFamily = family?.trim().toLowerCase();

  return (
    CANONICAL_FAMILIES[normalizedSymbol] ??
    (normalizedFamily
      ? CANONICAL_FAMILIES[normalizedFamily] ??
        normalizedFamily
      : undefined) ??
    normalizedSymbol
  );
}

function parseRecurringSymbols(
  value: string,
): RecurringSymbol[] {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is RecurringSymbol =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as RecurringSymbol).symbol ===
            "string" &&
          Number.isFinite(
            (item as RecurringSymbol).count,
          ),
      )
      .map((item) => {
        const symbol = item.symbol
          .trim()
          .toLowerCase();

        return {
          symbol,
          family: canonicalFamily(
            symbol,
            item.family,
          ),
          count: Math.min(
            100,
            Math.floor(item.count),
          ),
        };
      })
      .filter(
        (item) =>
          item.symbol.length > 0 &&
          item.count >= 1,
      )
      .filter(
        (item, index, items) =>
          items.findIndex(
            (candidate) =>
              candidate.symbol === item.symbol,
          ) === index,
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

const MOTIF_VOCABULARY = [
  "animal",
  "bird",
  "bridge",
  "city",
  "clock",
  "corridor",
  "darkness",
  "door",
  "fire",
  "fog",
  "forest",
  "garden",
  "house",
  "key",
  "lake",
  "light",
  "mirror",
  "moon",
  "mountain",
  "ocean",
  "path",
  "rain",
  "river",
  "room",
  "shadow",
  "stairs",
  "station",
  "storm",
  "train",
  "tree",
  "voice",
  "water",
  "window",
  "sky",
  "star",
  "stars",
  "constellation",
  "constellations",
  "planet",
  "galaxy",
] as const;

function extractFallbackMotifs(
  dream: string,
): RecurringSymbol[] {
  const normalized = dream.toLowerCase();

  return MOTIF_VOCABULARY.flatMap((symbol) => {
    const aliases =
      symbol === "stairs"
        ? ["stairs", "staircase"]
        : symbol === "water"
          ? ["water", "flood", "flooded"]
          : [symbol];

    const count = aliases.reduce(
      (total, alias) => {
        const matches = normalized.match(
          new RegExp(`\\b${alias}\\b`, "g"),
        );

        return total + (matches?.length ?? 0);
      },
      0,
    );

    return count > 0
      ? [
          {
            symbol,
            family: canonicalFamily(symbol),
            count,
          },
        ]
      : [];
  }).slice(0, 5);
}

export async function generateRecurringSymbols(
  dream: string,
): Promise<RecurringSymbol[]> {
  const normalizedDream = dream.trim();

  if (!normalizedDream) {
    return [];
  }

  const value = await runTextAgent({
    name: "repeated_dream_elements",
    instructions: SYMBOL_INSTRUCTIONS,
    input: `Remembered dream:\n${normalizedDream}`,
    maxOutputTokens: 180,
  });

    console.log("SYMBOL_AGENT_RAW", value);
    
  const parsed = value
    ? parseRecurringSymbols(value)
    : [];

  return parsed.length > 0
    ? parsed
    : extractFallbackMotifs(normalizedDream);
}