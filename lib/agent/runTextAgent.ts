import { dreamAiConfig } from "@/lib/agent/config";
import { openai } from "@/lib/agent/openai";

type RunTextAgentInput = {
  name: string;
  instructions: string;
  input: string;
  maxOutputTokens: number;
};

export async function runTextAgent({
  name,
  instructions,
  input,
  maxOutputTokens,
}: RunTextAgentInput): Promise<string | null> {
  if (!dreamAiConfig.enabled || !openai) {
    return null;
  }

  try {
    const response = await openai.responses.create({
      model: dreamAiConfig.model,
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
    });

    const value = response.output_text.trim();
    return value || null;
  } catch (error) {
    console.error("Dream agent failed", {
      agent: name,
      error,
    });

    return null;
  }
}
