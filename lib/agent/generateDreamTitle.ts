import { runTextAgent } from "@/lib/agent/runTextAgent";

const TITLE_INSTRUCTIONS = `
You create titles for remembered dreams.

The title must:
- contain 2 to 6 words,
- use English Title Case,
- feel poetic, cinematic, and mysterious,
- describe or evoke the remembered dream,
- never interpret the dream psychologically,
- never explain symbolism,
- never predict anything,
- contain no quotation marks,
- contain no punctuation at the end.

Return only the title.
`.trim();

function cleanTitle(value: string): string {
  return value
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/[.!?,;:]+$/g, "")
    .replace(/\s+/g, " ");
}

function isValidTitle(title: string): boolean {
  const wordCount = title.split(/\s+/).filter(Boolean).length;

  return wordCount >= 2 && wordCount <= 6;
}

const FALLBACK_OPENINGS = [
  "Beyond",
  "Beneath",
  "Inside",
  "After",
  "Where",
  "The",
] as const;

const FALLBACK_ENDINGS = [
  "Waited",
  "Returned",
  "Remembered",
  "Turned Silver",
  "Lost Its Shadow",
  "Stayed Awake",
] as const;

function hashText(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function meaningfulNoun(value: string): string {
  const stopWords = new Set([
    "about", "after", "again", "and", "been", "could", "dream", "from",
    "have", "into", "just", "like", "that", "the", "then", "there", "they",
    "this", "very", "was", "were", "when", "where", "with", "would",
  ]);
  const words = value
    .toLowerCase()
    .match(/[a-z]{4,}/g)
    ?.filter((word) => !stopWords.has(word));
  const word = words?.[hashText(value) % Math.max(words.length, 1)] ?? "Memory";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function createFallbackTitle(dream: string): string {
  const hash = hashText(dream);
  const opening = FALLBACK_OPENINGS[hash % FALLBACK_OPENINGS.length];
  const ending = FALLBACK_ENDINGS[
    Math.floor(hash / 7) % FALLBACK_ENDINGS.length
  ];
  const noun = meaningfulNoun(dream);

  return opening === "The"
    ? `The ${noun} That ${ending}`
    : `${opening} the ${noun}`;
}

export async function generateDreamTitle(dream: string): Promise<string> {
  const normalizedDream = dream.trim();
  const fallback = createFallbackTitle(normalizedDream);

  if (!normalizedDream) {
    return fallback;
  }

  const value = await runTextAgent({
    name: "dream_title",
    instructions: TITLE_INSTRUCTIONS,
    input: `Remembered dream:\n${normalizedDream}`,
    maxOutputTokens: 30,
  });
  const title = cleanTitle(value ?? "");

  return isValidTitle(title) ? title : fallback;
}
