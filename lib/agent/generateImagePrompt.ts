import { runTextAgent } from "@/lib/agent/runTextAgent";

const FALLBACK_IMAGE_PROMPT =
  "A quiet dreamscape at dusk, soft fog, cinematic lighting, surreal realism, mysterious atmosphere, no text";

const IMAGE_PROMPT_INSTRUCTIONS = `
You create visual prompts for dream imagery.

Your task is to transform a remembered dream and its narration into one concise image-generation prompt.

Rules:
- Write in English.
- Return only the image prompt.
- Keep it between 20 and 60 words.
- Preserve concrete visual details from the dream.
- Make it cinematic, atmospheric, and mysterious.
- Use visual language only.
- Do not interpret the dream.
- Do not explain symbolism.
- Do not mention psychology.
- Do not include text, captions, logos, or typography.
- Do not mention the user.
`.trim();

type GenerateImagePromptInput = {
  dream: string;
  narration: string;
  title: string;
};

export async function generateImagePrompt({
  dream,
  narration,
  title,
}: GenerateImagePromptInput): Promise<string> {
  const normalizedDream = dream.trim();
  const normalizedNarration = narration.trim();
  const normalizedTitle = title.trim();

  if (!normalizedDream) {
    return FALLBACK_IMAGE_PROMPT;
  }

  const imagePrompt = await runTextAgent({
    name: "image_prompt",
    instructions: IMAGE_PROMPT_INSTRUCTIONS,
    input: `
Dream title:
${normalizedTitle}

Remembered dream:
${normalizedDream}

Current narration:
${normalizedNarration}
    `.trim(),
    maxOutputTokens: 100,
  });

  return imagePrompt ?? FALLBACK_IMAGE_PROMPT;
}
