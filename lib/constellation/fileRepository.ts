import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { ConstellationRepository } from "@/lib/constellation/repository";
import { getDreamAtlasDataDirectory } from "@/lib/data/directory";
import type { Constellation } from "@/types/dream";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isConstellation(value: unknown): value is Constellation {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<Constellation>;

  return (
    typeof item.id === "string" &&
    UUID_PATTERN.test(item.id) &&
    typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    typeof item.updatedAt === "string" &&
    Number.isFinite(Date.parse(item.updatedAt)) &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    typeof item.summary === "string" &&
    item.summary.trim().length > 0 &&
    Array.isArray(item.motifs) &&
    item.motifs.every((motif) => typeof motif === "string" && motif.length > 0) &&
    Array.isArray(item.dreamIds) &&
    item.dreamIds.every((id) => typeof id === "string" && UUID_PATTERN.test(id)) &&
    typeof item.strength === "number" &&
    Number.isFinite(item.strength) &&
    item.strength >= 1 &&
    typeof item.confidence === "number" &&
    Number.isFinite(item.confidence) &&
    item.confidence >= 0 &&
    item.confidence <= 1
  );
}

function assertId(id: string): void {
  if (!UUID_PATTERN.test(id)) throw new Error("Invalid constellation id.");
}

export class FileConstellationRepository implements ConstellationRepository {
  private readonly directory: string;

  constructor(directory = getDreamAtlasDataDirectory("constellations")) {
    this.directory = directory;
  }

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.directory, { recursive: true });
  }

  private filePath(id: string): string {
    assertId(id);
    return path.join(this.directory, `${id}.json`);
  }

  async save(constellation: Constellation): Promise<void> {
    if (!isConstellation(constellation)) {
      throw new Error("Cannot save an invalid constellation.");
    }
    await this.ensureDirectory();
    const destination = this.filePath(constellation.id);
    const temporary = path.join(
      this.directory,
      `.${constellation.id}.${randomUUID()}.tmp`,
    );

    try {
      await fs.writeFile(temporary, JSON.stringify(constellation, null, 2), "utf8");
      await fs.rename(temporary, destination);
    } catch (error) {
      await fs.unlink(temporary).catch(() => undefined);
      throw error;
    }
  }

  async findAll(): Promise<Constellation[]> {
    await this.ensureDirectory();
    const files = (await fs.readdir(this.directory)).filter((name) =>
      name.endsWith(".json"),
    );
    const values = await Promise.all(
      files.map(async (name): Promise<Constellation | null> => {
        try {
          const parsed: unknown = JSON.parse(
            await fs.readFile(path.join(this.directory, name), "utf8"),
          );
          if (!isConstellation(parsed)) {
            throw new Error("Invalid constellation structure.");
          }
          return parsed;
        } catch (error) {
          console.error("Skipping invalid constellation file.", {
            fileName: name,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
          return null;
        }
      }),
    );

    return values
      .filter((value): value is Constellation => value !== null)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  async findById(id: string): Promise<Constellation | null> {
    try {
      const parsed: unknown = JSON.parse(
        await fs.readFile(this.filePath(id), "utf8"),
      );
      if (!isConstellation(parsed)) {
        throw new Error("Invalid constellation structure.");
      }
      return parsed;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
}

export const constellationRepository = new FileConstellationRepository();
