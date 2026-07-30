import { runTextAgent } from "@/lib/agent/runTextAgent";
import type { ConstellationInsight, GeneratedDream } from "@/types/dream";

type Input = {
  candidate: ConstellationInsight;
  newDream: GeneratedDream;
  previousDreams: GeneratedDream[];
};

export async function generateConstellationInsight({
  candidate,
  newDream,
  previousDreams,
}: Input): Promise<ConstellationInsight> {
  const relevantIds = new Set(candidate.dreamIds);
  const compactDreams = [newDream, ...previousDreams]
    .filter((dream) => relevantIds.has(dream.id))
    .map((dream) => ({
      id: dream.id,
      title: dream.title,
      fragments: dream.recurringSymbols.map(({ symbol }) => symbol),
      observation: dream.observation,
    }));

  const response = await runTextAgent({
    name: "ConstellationWeaver",
    instructions: `
You name a recurring pattern found by deterministic memory matching.

Return JSON only with "constellationName" and "summary".
- Use a poetic 2-5 word name.
- The summary is one short observational sentence.
- Describe only repeated details and changing arrangements.
- Never add or remove dreams or motifs.
- Never interpret symbols, diagnose the dreamer, or claim what a dream means.
    `.trim(),
    input: JSON.stringify({
      deterministicCandidate: candidate,
      memories: compactDreams,
    }),
    maxOutputTokens: 180,
  });

  if (!response) return candidate;

  try {
    const parsed = JSON.parse(
      response.replace(/^```json\s*|\s*```$/g, ""),
    ) as { constellationName?: unknown; summary?: unknown };
    if (
      typeof parsed.constellationName !== "string" ||
      !parsed.constellationName.trim() ||
      typeof parsed.summary !== "string" ||
      !parsed.summary.trim()
    ) {
      return candidate;
    }

    return {
      ...candidate,
      constellationName: parsed.constellationName.trim().slice(0, 80),
      summary: parsed.summary.trim().slice(0, 280),
    };
  } catch {
    return candidate;
  }
}
