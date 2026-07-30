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
  - "count": how many times it explicitly appears in the supplied dream.
- Include only concrete elements explicitly present in the dream.
- Do not interpret symbols.
- Do not assign psychological meaning.
- Do not invent details.
- Do not include emotions or abstract concepts.
- Return at most 5 items.
- Include a concrete element even if it appears only once in this dream.
- If there are no concrete visual elements, return [].

Example:
[
  {
    "symbol": "locked door",
    "count": 2
  }
]
`.trim();

function parseRecurringSymbols(value: string): RecurringSymbol[] {
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
          typeof (item as RecurringSymbol).symbol === "string" &&
          Number.isFinite((item as RecurringSymbol).count),
      )
      .map((item) => ({
        symbol: item.symbol.trim().toLowerCase(),
        count: Math.min(100, Math.floor(item.count)),
      }))
      .filter((item) => item.symbol.length > 0 && item.count >= 1)
      .filter(
        (item, index, items) =>
          items.findIndex((candidate) => candidate.symbol === item.symbol) === index,
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

const MOTIF_VOCABULARY = [
  "animal", "bird", "bridge", "city", "clock", "corridor", "darkness",
  "door", "fire", "fog", "forest", "garden", "house", "key", "lake",
  "light", "mirror", "moon", "mountain", "ocean", "path", "rain", "river",
  "room", "shadow", "stairs", "station", "storm", "train", "tree", "voice",
  "water", "window",
] as const;

function extractFallbackMotifs(dream: string): RecurringSymbol[] {
  const normalized = dream.toLowerCase();
  return MOTIF_VOCABULARY.flatMap((symbol) => {
    const aliases =
      symbol === "stairs"
        ? ["stairs", "staircase"]
        : symbol === "water"
          ? ["water", "flood", "flooded"]
          : [symbol];
    const count = aliases.reduce((total, alias) => {
      const matches = normalized.match(new RegExp(`\\b${alias}\\b`, "g"));
      return total + (matches?.length ?? 0);
    }, 0);
    return count > 0 ? [{ symbol, count }] : [];
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

  const parsed = value ? parseRecurringSymbols(value) : [];
  return parsed.length > 0 ? parsed : extractFallbackMotifs(normalizedDream);
}
