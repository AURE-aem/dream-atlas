import { randomUUID } from "node:crypto";

import type {
  Constellation,
  ConstellationInsight,
  GeneratedDream,
  RecurringSymbol,
} from "@/types/dream";

export type ConstellationPlan = {
  insight: ConstellationInsight;
  existing?: Constellation;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function motifKey(symbol: RecurringSymbol): string {
  return normalize(symbol.family ?? symbol.symbol);
}

function motifsOf(dream: GeneratedDream): string[] {
  return [
    ...new Set(
      dream.recurringSymbols.map((symbol) => motifKey(symbol)),
    ),
  ];
}

function sharedMotifs(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function fallbackName(motifs: string[]): string {
  const lead = motifs[0] ?? "memory";

  const names: Record<string, string> = {
    darkness: "The Unlit Threshold",
    door: "Doors That Return",
    forest: "The Moonlit Forest",
    moon: "Under the Returning Moon",
    water: "The Returning Tide",
    animal: "The Returning Creatures",
    "night sky": "The Celestial Path",
    machine: "The Mechanical Dream",
    journey: "The Returning Road",
  };

  return (
    names[lead] ??
    `The Returning ${lead.charAt(0).toUpperCase()}${lead.slice(1)}`
  );
}

export function planConstellation({
  newDream,
  previousDreams,
  constellations,
}: {
  newDream: GeneratedDream;
  previousDreams: GeneratedDream[];
  constellations: Constellation[];
}): ConstellationPlan | undefined {
  const currentMotifs = motifsOf(newDream);

  if (currentMotifs.length === 0) {
    return undefined;
  }

  const related = previousDreams
    .map((dream) => ({
      dream,
      shared: sharedMotifs(currentMotifs, motifsOf(dream)),
    }))
    .filter(({ shared }) => shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length);

  const existing = constellations
    .map((constellation) => ({
      constellation,
      overlap: sharedMotifs(
        currentMotifs,
        constellation.motifs,
      ).length,
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        b.constellation.strength - a.constellation.strength,
    )[0]?.constellation;

  if (existing) {
    const motifs = [
      ...new Set([
        ...existing.motifs,
        ...related.flatMap(({ shared }) => shared),
      ]),
    ].slice(0, 6);

    const dreamIds = [
      ...new Set([...existing.dreamIds, newDream.id]),
    ];

    return {
      existing,
      insight: {
        type: "strengthened_constellation",
        constellationId: existing.id,
        constellationName: existing.name,
        summary: `${motifs.slice(0, 3).join(", ")} returned in another preserved memory, adding a new point to this pattern.`,
        motifs,
        dreamIds,
        confidence: Math.min(
          0.98,
          existing.confidence + 0.03,
        ),
      },
    };
  }

  if (related.length < 2) {
    return undefined;
  }

  const motifs = [
    ...new Set(
      related.flatMap(({ shared }) => shared),
    ),
  ].slice(0, 6);

  const dreamIds = [
    newDream.id,
    ...related.slice(0, 5).map(({ dream }) => dream.id),
  ];

  return {
    insight: {
      type: "new_constellation",
      constellationName: fallbackName(motifs),
      summary: `${motifs.slice(0, 3).join(", ")} recur across ${dreamIds.length} preserved memories, each time in a different arrangement.`,
      motifs,
      dreamIds,
      confidence: Math.min(0.94, 0.64 + related.length * 0.06),
    },
  };
}

export function materializeConstellation(
  plan: ConstellationPlan,
  insight: ConstellationInsight,
  now = new Date().toISOString(),
): Constellation {
  const id = plan.existing?.id ?? randomUUID();

  return {
    id,
    createdAt: plan.existing?.createdAt ?? now,
    updatedAt: now,
    name: insight.constellationName,
    summary: insight.summary,
    motifs: [...new Set(insight.motifs.map(normalize))],
    dreamIds: [...new Set(insight.dreamIds)],
    strength: [...new Set(insight.dreamIds)].length,
    confidence: insight.confidence,
  };
}