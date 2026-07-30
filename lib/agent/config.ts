export const dreamAiConfig = {
  enabled: process.env.DREAM_AI_ENABLED === "true",
  model: process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini",
} as const;
