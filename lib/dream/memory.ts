import type {
  GeneratedDream,
  MemoryContext,
  MemoryEcho,
  RecurringSymbol,
} from "@/types/dream";

const MAX_ECHOES = 5;

function motifKey(symbol: RecurringSymbol): string {
  return normalizeSymbol(symbol.family ?? symbol.symbol);
}

export function buildMemoryContext({
  currentSymbols,
  previousDreams,
}: {
  currentSymbols: RecurringSymbol[];
  previousDreams: GeneratedDream[];
}): MemoryContext {
  const currentSymbolNames = new Set(
    currentSymbols
      .map((symbol) => motifKey(symbol))
      .filter(Boolean),
  );

  const echoes: MemoryEcho[] = [];

  for (const symbol of currentSymbolNames) {
    const relatedDreams = previousDreams.filter((dream) =>
      dream.recurringSymbols?.some(
        (candidate) => motifKey(candidate) === symbol,
      ),
    );

    if (relatedDreams.length === 0) {
      continue;
    }

    const totalPreviousOccurrences = relatedDreams.reduce(
      (total, dream) => {
        const matchingSymbol = dream.recurringSymbols.find(
          (candidate) => motifKey(candidate) === symbol,
        );

        return total + (matchingSymbol?.count ?? 1);
      },
      0,
    );

    const lastSeenAt = relatedDreams
      .map((dream) => dream.createdAt)
      .filter((date) => Number.isFinite(Date.parse(date)))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

    echoes.push({
      symbol,
      previousDreamCount: relatedDreams.length,
      totalPreviousOccurrences,
      relatedDreamIds: relatedDreams.map((dream) => dream.id),
      lastSeenAt,
    });
  }

  echoes.sort(
    (a, b) =>
      b.previousDreamCount - a.previousDreamCount ||
      b.totalPreviousOccurrences - a.totalPreviousOccurrences ||
      a.symbol.localeCompare(b.symbol),
  );

  const visibleEchoes = echoes.slice(0, MAX_ECHOES);

  return {
    echoes: visibleEchoes,
    relatedDreamIds: Array.from(
      new Set(visibleEchoes.flatMap((echo) => echo.relatedDreamIds)),
    ),
    summary: createMemorySummary(visibleEchoes),
  };
}

function createMemorySummary(echoes: MemoryEcho[]): string {
  if (echoes.length === 0) {
    return "No earlier dream in the archive shares these fragments yet.";
  }

  const fragments = echoes.map((echo) => {
    const dreamWord = echo.previousDreamCount === 1 ? "dream" : "dreams";

    return `${capitalize(echo.symbol)} appeared in ${echo.previousDreamCount} previous ${dreamWord}`;
  });

  if (fragments.length === 1) {
    return `${fragments[0]}.`;
  }

  return `${fragments.slice(0, -1).join(", ")}, and ${fragments.at(-1)}.`;
}

function normalizeSymbol(value: string): string {
  return value.trim().toLowerCase();
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
