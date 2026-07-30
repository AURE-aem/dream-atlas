import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type {
  GeneratedDream,
  PlayfulInterpretation,
  RecurringSymbol,
} from "@/types/dream";
import type { DreamRepository } from "@/lib/dream/repository";
import { getDreamAtlasDataDirectory } from "../data/directory.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecurringSymbol(value: unknown): value is RecurringSymbol {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const symbol = value as Partial<RecurringSymbol>;

  return (
    typeof symbol.symbol === "string" &&
    symbol.symbol.trim().length > 0 &&
    typeof symbol.count === "number" &&
    Number.isFinite(symbol.count) &&
    symbol.count >= 1
  );
}

function isGeneratedDream(value: unknown): value is GeneratedDream {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const dream = value as Partial<GeneratedDream> & { choices?: unknown };

  return (
    typeof dream.id === "string" &&
    UUID_PATTERN.test(dream.id) &&
    typeof dream.createdAt === "string" &&
    Number.isFinite(Date.parse(dream.createdAt)) &&
    typeof dream.title === "string" &&
    typeof dream.narration === "string" &&
    (dream.choices === undefined ||
      (Array.isArray(dream.choices) &&
        dream.choices.every((choice) => typeof choice === "string"))) &&
    typeof dream.imagePrompt === "string" &&
    typeof dream.originalDream === "string" &&
    Array.isArray(dream.recurringSymbols) &&
    dream.recurringSymbols.every(isRecurringSymbol) &&
    typeof dream.observation === "string" &&
    (dream.diagnosis === undefined || typeof dream.diagnosis === "string") &&
    (dream.reflectionQuestions === undefined ||
      (Array.isArray(dream.reflectionQuestions) &&
        dream.reflectionQuestions.every((item) => typeof item === "string"))) &&
    isPlayfulInterpretation(dream.playfulInterpretation) &&
    (dream.constellationId === undefined ||
      (typeof dream.constellationId === "string" &&
        UUID_PATTERN.test(dream.constellationId))) &&
    isConstellationInsight(dream.constellation) &&
    (dream.calendarInsight === undefined ||
      typeof dream.calendarInsight === "string") &&
    (dream.risk === "none" || dream.risk === "concern")
  );
}

function isPlayfulInterpretation(
  value: unknown,
): value is PlayfulInterpretation | undefined {
  if (value === undefined) return true;
  if (typeof value !== "object" || value === null) return false;

  const interpretation = value as Partial<PlayfulInterpretation>;
  return (
    typeof interpretation.title === "string" &&
    interpretation.title.trim().length > 0 &&
    typeof interpretation.text === "string" &&
    interpretation.text.trim().length > 0 &&
    Array.isArray(interpretation.motifs) &&
    interpretation.motifs.every(
      (motif) => typeof motif === "string" && motif.trim().length > 0,
    ) &&
    (interpretation.source === "ai" ||
      interpretation.source === "fallback")
  );
}

function isConstellationInsight(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== "object" || value === null) return false;
  const insight = value as {
    type?: unknown;
    constellationId?: unknown;
    constellationName?: unknown;
    summary?: unknown;
    motifs?: unknown;
    dreamIds?: unknown;
    confidence?: unknown;
  };
  return (
    (insight.type === "new_constellation" || insight.type === "strengthened_constellation") &&
    (insight.constellationId === undefined ||
      (typeof insight.constellationId === "string" &&
        UUID_PATTERN.test(insight.constellationId))) &&
    typeof insight.constellationName === "string" &&
    insight.constellationName.trim().length > 0 &&
    typeof insight.summary === "string" &&
    Array.isArray(insight.motifs) && insight.motifs.every((item) => typeof item === "string") &&
    Array.isArray(insight.dreamIds) && insight.dreamIds.every((item) => typeof item === "string" && UUID_PATTERN.test(item)) &&
    typeof insight.confidence === "number" && Number.isFinite(insight.confidence) &&
    insight.confidence >= 0 && insight.confidence <= 1
  );
}

function assertValidDreamId(id: string): void {
  if (!UUID_PATTERN.test(id)) {
    throw new Error("Invalid dream id.");
  }
}

function parseStoredDream(content: string, fileName: string): GeneratedDream {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Dream file ${fileName} contains invalid JSON.`);
  }

  if (!isGeneratedDream(parsed)) {
    throw new Error(`Dream file ${fileName} has an invalid structure.`);
  }

  return parsed;
}

export class FileDreamRepository implements DreamRepository {
  private readonly dreamsDirectory: string;

  constructor(dreamsDirectory = getDreamAtlasDataDirectory("dreams")) {
    this.dreamsDirectory = dreamsDirectory;
  }

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.dreamsDirectory, {
      recursive: true,
    });
  }

  private getFilePath(id: string): string {
    assertValidDreamId(id);

    return path.join(this.dreamsDirectory, `${id}.json`);
  }

  async save(dream: GeneratedDream): Promise<void> {
    await this.ensureDirectory();
    assertValidDreamId(dream.id);

    if (!isGeneratedDream(dream)) {
      throw new Error("Cannot save an invalid dream.");
    }

    const filePath = this.getFilePath(dream.id);
    const temporaryPath = path.join(
      this.dreamsDirectory,
      `.${dream.id}.${randomUUID()}.tmp`,
    );
    const serializedDream = JSON.stringify(dream, null, 2);

    try {
      await fs.writeFile(temporaryPath, serializedDream, "utf8");
      await fs.rename(temporaryPath, filePath);
    } catch (error) {
      try {
        await fs.unlink(temporaryPath);
      } catch {
        // The temporary file may not exist if writing failed early.
      }

      throw error;
    }
  }

  async findAll(): Promise<GeneratedDream[]> {
    await this.ensureDirectory();

    const fileNames = await fs.readdir(this.dreamsDirectory);
    const dreamFiles = fileNames.filter((fileName) =>
      fileName.endsWith(".json"),
    );

    const results = await Promise.all(
      dreamFiles.map(async (fileName): Promise<GeneratedDream | null> => {
        const filePath = path.join(this.dreamsDirectory, fileName);

        try {
          const content = await fs.readFile(filePath, "utf8");
          return parseStoredDream(content, fileName);
        } catch (error) {
          console.error("Skipping invalid dream file.", {
            fileName,
            reason: error instanceof Error ? error.message : "Unknown error",
          });

          return null;
        }
      }),
    );

    return results
      .filter((dream): dream is GeneratedDream => dream !== null)
      .sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
  }

  async findById(id: string): Promise<GeneratedDream | null> {
    const filePath = this.getFilePath(id);
    const fileName = path.basename(filePath);

    try {
      const content = await fs.readFile(filePath, "utf8");
      return parseStoredDream(content, fileName);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }

      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }

      throw error;
    }
  }
}

export const dreamRepository = new FileDreamRepository();
