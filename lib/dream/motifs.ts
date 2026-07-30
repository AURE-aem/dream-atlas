import type {
  GeneratedDream,
  PlayfulInterpretation,
  RecurringSymbol,
} from "@/types/dream";

export type RankedMotif = {
  symbol: string;
  dreamCount: number;
  totalCount: number;
};

export function rankRecurringMotifs({
  currentSymbols,
  previousDreams,
  limit = 4,
}: {
  currentSymbols: RecurringSymbol[];
  previousDreams: GeneratedDream[];
  limit?: number;
}): RankedMotif[] {
  const motifs = new Map<
    string,
    {
      dreamIds: Set<string>;
      totalCount: number;
    }
  >();

  const memories = [
    {
      id: "current-memory",
      recurringSymbols: currentSymbols,
    },
    ...previousDreams,
  ];

  for (const memory of memories) {
    for (const motif of memory.recurringSymbols ?? []) {
      const symbol = motif.symbol.trim().toLowerCase();
      if (!symbol) continue;

      const current = motifs.get(symbol) ?? {
        dreamIds: new Set<string>(),
        totalCount: 0,
      };
      current.dreamIds.add(memory.id);
      current.totalCount += Math.max(1, Math.floor(motif.count));
      motifs.set(symbol, current);
    }
  }

  const ranked = Array.from(motifs, ([symbol, value]) => ({
    symbol,
    dreamCount: value.dreamIds.size,
    totalCount: value.totalCount,
  })).sort(
    (a, b) =>
      b.dreamCount - a.dreamCount ||
      b.totalCount - a.totalCount ||
      a.symbol.localeCompare(b.symbol),
  );

  const recurring = ranked.filter(({ dreamCount }) => dreamCount > 1);
  return (recurring.length > 0 ? recurring : ranked).slice(
    0,
    Math.max(1, limit),
  );
}

export function createPlayfulInterpretationFallback(
  motifs: RankedMotif[],
): PlayfulInterpretation {
  const motifNames = motifs.map(({ symbol }) => symbol);

  if (motifNames.length === 0) {
    return {
      title: "The Kingdom Between Props",
      text: "The dream theatre is still unpacking its scenery, so tonight the mind has staged a charming rehearsal with the curtains half closed. A playful reading might say that the important characters have not missed their entrance—they are simply making the audience wait for dramatic effect. No secret verdict is hiding backstage. This is only a small fairy tale about memory warming up, checking the lights, and deciding which curious prop deserves a return performance.",
      motifs: [],
      source: "fallback",
    };
  }

  const [first, ...rest] = motifNames;
  const companions = formatList(rest);
  const recurringCast = formatList(motifNames);

  return {
    title: `The Curious Council of ${capitalize(first)}`,
    text: `${capitalize(recurringCast)} have apparently formed a small council in the private kingdom of memory. ${capitalize(first)} keeps calling the meetings${companions ? `, while ${companions} arrive with suspiciously good timing` : ""}. A playful reading might say these returning props are familiar questions wearing fairy-tale costumes—not a verdict, just the mind trying on another ending. If this were a storybook, nobody would need to decode the signs; the hero could simply notice who keeps knocking and offer them a chair.`,
    motifs: motifNames,
    source: "fallback",
  };
}

function formatList(values: string[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
