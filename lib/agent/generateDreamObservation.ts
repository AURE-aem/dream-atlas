import { runTextAgent } from "@/lib/agent/runTextAgent";

const FALLBACK_OBSERVATION = "Atlas is holding this fragment in memory.";

const OBSERVATION_INSTRUCTIONS = `
You write one brief observation about a remembered dream.

Rules:
- Write in English.
- Write exactly one sentence.
- Keep it poetic, calm, and mysterious.
- Refer only to details present in the dream or narration.
- Do not interpret symbols.
- Do not explain psychological meaning.
- Do not diagnose.
- Do not predict the future.
- Do not give advice.
- Do not ask a question.
- Return only the observation.
`.trim();

type GenerateDreamObservationInput = {
  dream: string;
  narration: string;
};

export async function generateDreamObservation({
  dream,
  narration,
}: GenerateDreamObservationInput): Promise<string> {
  const normalizedDream = dream.trim();
  const normalizedNarration = narration.trim();

  if (!normalizedDream) {
    return FALLBACK_OBSERVATION;
  }

  const observation = await runTextAgent({
    name: "dream_observation",
    instructions: OBSERVATION_INSTRUCTIONS,
    input: `
Remembered dream:
${normalizedDream}

Current scene:
${normalizedNarration}
    `.trim(),
    maxOutputTokens: 50,
  });

  return observation ?? FALLBACK_OBSERVATION;
}
