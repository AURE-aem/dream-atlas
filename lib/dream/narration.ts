const OPENING_QUOTES = /[“"']\s*$/u;
const CLOSING_QUOTES = /^\s*[”"']/u;
const GENERATED_CORE_LEAD =
  /(?:You remember it exactly|The unchanged core)\s*:\s*$/iu;

export type DreamNarrationParts = {
  core: string;
  surrounding: string;
};

/**
 * The stored original dream is the one immutable part of a Dream Memory.
 * Language models are asked to quote it exactly, and this deterministic guard
 * makes the contract true even when a model omits or paraphrases the quote.
 */
export function ensureVerbatimDreamCore(
  narration: string,
  originalDream: string,
): string {
  const surrounding = narration.trim();
  if (!originalDream.trim()) return surrounding;
  if (surrounding.includes(originalDream)) return surrounding;

  return surrounding
    ? `You remember it exactly: “${originalDream}”\n\n${surrounding}`
    : `You remember it exactly: “${originalDream}”`;
}

/**
 * The UI presents the verbatim core once, prominently, and keeps the
 * AI-shaped atmosphere around it visually quieter.
 */
export function getDreamNarrationParts(
  narration: string,
  originalDream: string,
): DreamNarrationParts {
  if (!originalDream.trim()) {
    return { core: "", surrounding: narration.trim() };
  }

  const guaranteedNarration = ensureVerbatimDreamCore(
    narration,
    originalDream,
  );
  const coreIndex = guaranteedNarration.indexOf(originalDream);
  const before = guaranteedNarration
    .slice(0, coreIndex)
    .replace(OPENING_QUOTES, "")
    .replace(GENERATED_CORE_LEAD, "")
    .trim();
  const after = guaranteedNarration
    .slice(coreIndex + originalDream.length)
    .replace(CLOSING_QUOTES, "")
    .trim();

  return {
    core: originalDream,
    surrounding: [before, after].filter(Boolean).join(" ").trim(),
  };
}
