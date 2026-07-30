import { runTextAgent } from "@/lib/agent/runTextAgent";

const INSTRUCTIONS = `
You offer gentle questions that help someone return to a remembered dream.

Rules:
- Return exactly 3 questions, one per line.
- Write in English.
- Ask only about details, atmosphere, movement, or felt experience present in
  the supplied memory.
- Never interpret a symbol or claim what the dream means.
- Never diagnose, predict, or prescribe.
- Keep every question under 14 words.
`.trim();

const FALLBACK_QUESTIONS = [
  "Which detail stayed clearest after you woke?",
  "Where did the atmosphere change inside the memory?",
  "What would you want to notice if you returned?",
] as const;

function parseQuestions(value: string): string[] {
  const questions = value
    .split("\n")
    .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, "").trim())
    .filter((line) => line.endsWith("?") && line.split(/\s+/).length <= 14);

  return [...new Set(questions)].slice(0, 3);
}

export async function generateReflectionQuestions({
  dream,
  observation,
}: {
  dream: string;
  observation: string;
}): Promise<string[]> {
  const value = await runTextAgent({
    name: "reflection_questions",
    instructions: INSTRUCTIONS,
    input: `Remembered dream:\n${dream}\n\nObservation:\n${observation}`,
    maxOutputTokens: 100,
  });
  const parsed = value ? parseQuestions(value) : [];

  return parsed.length === 3 ? parsed : [...FALLBACK_QUESTIONS];
}
