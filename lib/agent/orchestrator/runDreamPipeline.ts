import { randomUUID } from "node:crypto";

import { dreamAiConfig } from "@/lib/agent/config";
import { generateAtlasNarration } from "@/lib/agent/generateAtlasNarration";
import { generateConstellationInsight } from "@/lib/agent/generateConstellationInsight";
import { generateDreamObservation } from "@/lib/agent/generateDreamObservation";
import { generateDreamTitle } from "@/lib/agent/generateDreamTitle";
import { generateImagePrompt } from "@/lib/agent/generateImagePrompt";
import { generatePlayfulInterpretation } from "@/lib/agent/generatePlayfulInterpretation";
import { generateRecurringSymbols } from "@/lib/agent/generateRecurringSymbols";
import { generateReflectionQuestions } from "@/lib/agent/generateReflectionQuestions";
import { openai } from "@/lib/agent/openai";
import { runAgent } from "@/lib/agent/runtime/runAgent";
import type { AgentTraceEntry } from "@/lib/agent/runtime/types";
import { constellationRepository } from "@/lib/constellation/fileRepository";
import {
  materializeConstellation,
  planConstellation,
} from "@/lib/constellation/weave";
import { dreamRepository } from "@/lib/dream/fileRepository";
import { buildMemoryContext } from "@/lib/dream/memory";
import type { GeneratedDream } from "@/types/dream";

type RunDreamPipelineInput = {
  dream: string;
};

export type DreamPipelineResult = {
  dream: GeneratedDream;
  trace: AgentTraceEntry[];
  totalDurationMs: number;
};

const aiUnavailable = () => !dreamAiConfig.enabled || !openai;

export async function runDreamPipeline({
  dream,
}: RunDreamPipelineInput): Promise<DreamPipelineResult> {
  const pipelineStartedAt = Date.now();
  const trace: AgentTraceEntry[] = [];

  const [
    memoryRetrieveResult,
    constellationRetrieveResult,
    titleResult,
    narrationResult,
  ] = await Promise.all([
    runAgent({
      name: "Memory.Retrieve",
      run: () => dreamRepository.findAll(),
    }),
    runAgent({
      name: "Constellation.Retrieve",
      run: () => constellationRepository.findAll(),
    }),
    runAgent({
      name: "Archivist.Title",
      run: () => generateDreamTitle(dream),
      fallbackWhen: aiUnavailable,
    }),
    runAgent({
      name: "Archivist.Narration",
      run: () => generateAtlasNarration({ dream }),
      fallbackWhen: aiUnavailable,
    }),
  ]);

  trace.push(
    memoryRetrieveResult.trace,
    constellationRetrieveResult.trace,
    titleResult.trace,
    narrationResult.trace,
  );

  const [observationResult, imagePromptResult, symbolsResult] =
    await Promise.all([
      runAgent({
        name: "Observer.Observation",
        run: () =>
          generateDreamObservation({
            dream,
            narration: narrationResult.value,
          }),
        fallbackWhen: aiUnavailable,
      }),
      runAgent({
        name: "Cartographer.ImagePrompt",
        run: () =>
          generateImagePrompt({
            dream,
            narration: narrationResult.value,
            title: titleResult.value,
          }),
        fallbackWhen: aiUnavailable,
      }),
      runAgent({
        name: "PatternKeeper.Motifs",
        run: () => generateRecurringSymbols(dream),
        fallbackWhen: aiUnavailable,
      }),
    ]);

  trace.push(
    observationResult.trace,
    imagePromptResult.trace,
    symbolsResult.trace,
  );

  const [memoryMatchResult, reflectionResult, interpretationResult] =
    await Promise.all([
      runAgent({
        name: "Memory.Match",
        run: async () =>
          buildMemoryContext({
            currentSymbols: symbolsResult.value,
            previousDreams: memoryRetrieveResult.value,
          }),
      }),
      runAgent({
        name: "Reflector.Questions",
        run: () =>
          generateReflectionQuestions({
            dream,
            observation: observationResult.value,
          }),
        fallbackWhen: aiUnavailable,
      }),
      runAgent({
        name: "MotifStoryteller.Interpret",
        run: () =>
          generatePlayfulInterpretation({
            currentSymbols: symbolsResult.value,
            previousDreams: memoryRetrieveResult.value,
          }),
        fallbackWhen: (value) => value.source === "fallback",
      }),
    ]);
  trace.push(
    memoryMatchResult.trace,
    reflectionResult.trace,
    interpretationResult.trace,
  );

  const generatedDream: GeneratedDream = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    title: titleResult.value,
    narration: narrationResult.value,
    imagePrompt: imagePromptResult.value,
    originalDream: dream,
    recurringSymbols: symbolsResult.value,
    observation: observationResult.value,
    reflectionQuestions: reflectionResult.value,
    playfulInterpretation: interpretationResult.value,
    memoryContext: memoryMatchResult.value,
    calendarInsight: undefined,
    risk: "none",
  };

  const saveResult = await runAgent({
    name: "Memory.Save",
    run: async () => {
      await dreamRepository.save(generatedDream);
      return true;
    },
  });
  trace.push(saveResult.trace);

  const constellationMatchResult = await runAgent({
    name: "ConstellationWeaver.Match",
    run: async () =>
      planConstellation({
        newDream: generatedDream,
        previousDreams: memoryRetrieveResult.value,
        constellations: constellationRetrieveResult.value,
      }),
  });
  trace.push(constellationMatchResult.trace);

  if (!constellationMatchResult.value) {
    return {
      dream: generatedDream,
      trace,
      totalDurationMs: Date.now() - pipelineStartedAt,
    };
  }

  const constellationNarrationResult = await runAgent({
    name: "ConstellationWeaver.Narrate",
    run: () =>
      generateConstellationInsight({
        candidate: constellationMatchResult.value!.insight,
        newDream: generatedDream,
        previousDreams: memoryRetrieveResult.value,
      }),
    fallbackWhen: aiUnavailable,
  });
  trace.push(constellationNarrationResult.trace);

  const constellation = materializeConstellation(
    constellationMatchResult.value,
    constellationNarrationResult.value,
  );
  const insight = {
    ...constellationNarrationResult.value,
    constellationId: constellation.id,
  };

  const constellationSaveResult = await runAgent({
    name: "Constellation.Save",
    run: async () => {
      await constellationRepository.save(constellation);
      return true;
    },
  });
  trace.push(constellationSaveResult.trace);

  const dreamWithConstellation: GeneratedDream = {
    ...generatedDream,
    constellationId: constellation.id,
    constellation: insight,
  };
  const atlasUpdateResult = await runAgent({
    name: "Atlas.Update",
    run: async () => {
      await dreamRepository.save(dreamWithConstellation);
      return true;
    },
  });
  trace.push(atlasUpdateResult.trace);

  return {
    dream: dreamWithConstellation,
    trace,
    totalDurationMs: Date.now() - pipelineStartedAt,
  };
}
