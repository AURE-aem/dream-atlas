import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { UserRepository } from "./repository.ts";
import type { StoredUser } from "./types.ts";
import { getDreamAtlasDataDirectory } from "../data/directory.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isStoredUser(value: unknown): value is StoredUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Partial<StoredUser>;

  return (
    typeof user.id === "string" &&
    UUID_PATTERN.test(user.id) &&
    typeof user.email === "string" &&
    user.email === normalizeEmail(user.email) &&
    user.email.length > 0 &&
    typeof user.passwordHash === "string" &&
    user.passwordHash.length > 0 &&
    typeof user.createdAt === "string" &&
    Number.isFinite(Date.parse(user.createdAt))
  );
}

function assertValidUser(user: StoredUser): void {
  if (!isStoredUser(user)) {
    throw new Error("Cannot save an invalid user.");
  }
}

function assertValidUserId(id: string): void {
  if (!UUID_PATTERN.test(id)) {
    throw new Error("Invalid user id.");
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function parseStoredUser(
  content: string,
  fileName: string,
): StoredUser {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`User file ${fileName} contains invalid JSON.`);
  }

  if (!isStoredUser(parsed)) {
    throw new Error(
      `User file ${fileName} has an invalid structure.`,
    );
  }

  return parsed;
}

export class FileUserRepository implements UserRepository {
  private readonly usersDirectory: string;

  constructor(
    usersDirectory = getDreamAtlasDataDirectory("users"),
  ) {
    this.usersDirectory = usersDirectory;
  }

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.usersDirectory, { recursive: true });
  }

  private getFilePath(id: string): string {
    assertValidUserId(id);

    return path.join(this.usersDirectory, `${id}.json`);
  }

  private async findAll(): Promise<StoredUser[]> {
    await this.ensureDirectory();

    const fileNames = (await fs.readdir(this.usersDirectory))
      .filter((fileName) => fileName.endsWith(".json"));

    return Promise.all(
      fileNames.map(async (fileName) => {
        const content = await fs.readFile(
          path.join(this.usersDirectory, fileName),
          "utf8",
        );

        return parseStoredUser(content, fileName);
      }),
    );
  }

  async save(user: StoredUser): Promise<void> {
    assertValidUser(user);
    await this.ensureDirectory();

    const existingUser = await this.findByEmail(user.email);

    if (existingUser && existingUser.id !== user.id) {
      throw new Error("A user with this email already exists.");
    }

    const destinationPath = this.getFilePath(user.id);
    const temporaryPath = path.join(
      this.usersDirectory,
      `.${user.id}.${randomUUID()}.tmp`,
    );

    try {
      await fs.writeFile(
        temporaryPath,
        JSON.stringify(user, null, 2),
        "utf8",
      );
      await fs.rename(temporaryPath, destinationPath);
    } catch (error) {
      await fs.unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
  }

  async findById(id: string): Promise<StoredUser | null> {
    const filePath = this.getFilePath(id);

    try {
      const content = await fs.readFile(filePath, "utf8");

      return parseStoredUser(content, path.basename(filePath));
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    const normalizedEmail = normalizeEmail(email);
    const users = await this.findAll();

    return (
      users.find((user) => user.email === normalizedEmail) ?? null
    );
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (!isMissingFileError(error)) {
        throw error;
      }
    }
  }
}

export const userRepository = new FileUserRepository();
