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
    console.log("[AI AGENT SKIPPED]", name, {
      enabled: dreamAiConfig.enabled,
      hasOpenAI: Boolean(openai),
    });

    return null;
  }

  try {
    console.log("[AI AGENT START]", name);

    const response = await openai.responses.create({
      model: dreamAiConfig.model,
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
    });

    console.log("[AI AGENT SUCCESS]", name);

    const value = response.output_text.trim();

    console.log("[AI AGENT RESULT]", name, value);

    return value || null;
  } catch (error) {
    console.error("[AI AGENT FAILED]", {
      agent: name,
      error,
    });

    return null;
  }
}