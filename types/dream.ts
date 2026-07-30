export type RecurringSymbol = {
  symbol: string;
  count: number;
};

export type MemoryEcho = {
  symbol: string;
  previousDreamCount: number;
  totalPreviousOccurrences: number;
  relatedDreamIds: string[];
  lastSeenAt?: string;
};

export type MemoryContext = {
  echoes: MemoryEcho[];
  relatedDreamIds: string[];
  summary: string;
};

export type ConstellationInsight = {
  type: "new_constellation" | "strengthened_constellation";
  constellationId?: string;
  constellationName: string;
  summary: string;
  motifs: string[];
  dreamIds: string[];
  confidence: number;
};

export type Constellation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  summary: string;
  motifs: string[];
  dreamIds: string[];
  strength: number;
  confidence: number;
};

export type PlayfulInterpretation = {
  title: string;
  text: string;
  motifs: string[];
  source: "ai" | "fallback";
};

export type GeneratedDream = {
  id: string;

  createdAt: string;

  title: string;

  narration: string;

  imagePrompt: string;

  originalDream: string;

  recurringSymbols: RecurringSymbol[];

  observation: string;

  /**
   * Kept optional so memories created by the early prototype remain readable.
   * New memories use reflectionQuestions instead of pseudo-diagnosis.
   */
  diagnosis?: string;

  reflectionQuestions?: string[];

  playfulInterpretation?: PlayfulInterpretation;

  memoryContext?: MemoryContext;

  constellationId?: string;

  constellation?: ConstellationInsight;

  calendarInsight?: string;

  risk: "none" | "concern";
};
