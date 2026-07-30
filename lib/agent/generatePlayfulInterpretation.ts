import { runTextAgent } from "@/lib/agent/runTextAgent";
import {
  createPlayfulInterpretationFallback,
  rankRecurringMotifs,
} from "@/lib/dream/motifs";
import type {
  GeneratedDream,
  PlayfulInterpretation,
  RecurringSymbol,
} from "@/types/dream";

const INSTRUCTIONS = `
You are the Motif Storyteller: a warm, witty storybook psychologist.

Write a playful fairy-tale interpretation of the recurring motifs selected by
deterministic code.

Rules:
- Return valid JSON only with "title" and "text".
- Write in English.
- The title is whimsical and 3-8 words.
- The text is 75-120 words.
- Use only the supplied motifs and their recurrence counts.
- Treat every idea as a humorous possibility, never as a fact.
- Keep the tone kind, imaginative, lightly funny, and psychologically curious.
- Do not diagnose, predict, prescribe, mention disorders, or claim hidden truth.
- Do not invent biographical facts or universal symbol meanings.
- Do not add a disclaimer inside the text.
`.trim();

export async function generatePlayfulInterpretation({
  currentSymbols,
  previousDreams,
}: {
  currentSymbols: RecurringSymbol[];
  previousDreams: GeneratedDream[];
}): Promise<PlayfulInterpretation> {
  const motifs = rankRecurringMotifs({
    currentSymbols,
    previousDreams,
  });
  const fallback = createPlayfulInterpretationFallback(motifs);

  if (motifs.length === 0) return fallback;

  const response = await runTextAgent({
    name: "MotifStoryteller",
    instructions: INSTRUCTIONS,
    input: JSON.stringify({ recurringMotifs: motifs }),
    maxOutputTokens: 260,
  });

  if (!response) return fallback;

  try {
    const parsed = JSON.parse(
      response.replace(/^```json\s*|\s*```$/g, ""),
    ) as { title?: unknown; text?: unknown };

    if (
      typeof parsed.title !== "string" ||
      !parsed.title.trim() ||
      typeof parsed.text !== "string" ||
      !parsed.text.trim()
    ) {
      return fallback;
    }

    const wordCount = parsed.text.trim().split(/\s+/).length;
    if (wordCount < 55 || wordCount > 140) return fallback;

    return {
      title: parsed.title.trim().slice(0, 90),
      text: parsed.text.trim().slice(0, 900),
      motifs: motifs.map(({ symbol }) => symbol),
      source: "ai",
    };
  } catch {
    return fallback;
  }
}
