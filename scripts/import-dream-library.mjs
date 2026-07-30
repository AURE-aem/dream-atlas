import { copyFile, mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { materializeDreamLibrarySource } from "./dream-library-path.mjs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const argumentsList = process.argv.slice(2);
const sourceArgument = argumentsList.find(
  (argument) => !argument.startsWith("--"),
);
const forceImport = argumentsList.includes("--force");

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonDirectory(directory, kind) {
  const names = (await readdir(directory))
    .filter((name) => name.endsWith(".json"))
    .sort();

  return Promise.all(
    names.map(async (name) => {
      let value;
      try {
        value = JSON.parse(await readFile(path.join(directory, name), "utf8"));
      } catch {
        fail(`${kind} file ${name} is not valid JSON.`);
      }
      return { name, value };
    }),
  );
}

function validateDream(entry) {
  const { name, value } = entry;
  if (!isObject(value)) fail(`Dream file ${name} must contain an object.`);
  if (typeof value.id !== "string" || !UUID_PATTERN.test(value.id)) {
    fail(`Dream file ${name} has an invalid id.`);
  }
  if (name !== `${value.id}.json`) {
    fail(`Dream file ${name} does not match its id.`);
  }
  if (
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt))
  ) {
    fail(`Dream file ${name} has an invalid creation date.`);
  }
  if (
    typeof value.originalDream !== "string" ||
    value.originalDream.length === 0
  ) {
    fail(`Dream file ${name} has no immutable originalDream.`);
  }
  if (
    typeof value.narration !== "string" ||
    !value.narration.includes(value.originalDream)
  ) {
    fail(`Dream file ${name} does not quote originalDream verbatim.`);
  }
}

function validateConstellation(entry, dreamIds) {
  const { name, value } = entry;
  if (!isObject(value)) {
    fail(`Constellation file ${name} must contain an object.`);
  }
  if (typeof value.id !== "string" || !UUID_PATTERN.test(value.id)) {
    fail(`Constellation file ${name} has an invalid id.`);
  }
  if (name !== `${value.id}.json`) {
    fail(`Constellation file ${name} does not match its id.`);
  }
  if (
    !Array.isArray(value.dreamIds) ||
    value.dreamIds.some(
      (dreamId) => typeof dreamId !== "string" || !dreamIds.has(dreamId),
    )
  ) {
    fail(`Constellation file ${name} references a missing dream.`);
  }
}

async function listJsonFiles(directory) {
  try {
    return (await readdir(directory)).filter((name) => name.endsWith(".json"));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function importLibrary() {
  if (!sourceArgument) {
    fail(
      "Provide a dream library folder or ZIP: npm run demo:import -- <path> [--force]",
    );
  }

  const resolvedSource = await materializeDreamLibrarySource(sourceArgument);
  const sourceDirectory = resolvedSource.directory;
  try {
  const sourceDreams = path.join(sourceDirectory, "dreams");
  const sourceConstellations = path.join(sourceDirectory, "constellations");
  const targetDataDirectory = process.env.DREAM_ATLAS_DATA_DIR
    ? path.resolve(process.env.DREAM_ATLAS_DATA_DIR)
    : path.join(process.cwd(), "data");
  const targetDreams = path.join(targetDataDirectory, "dreams");
  const targetConstellations = path.join(
    targetDataDirectory,
    "constellations",
  );

  const [dreamEntries, constellationEntries] = await Promise.all([
    readJsonDirectory(sourceDreams, "Dream"),
    readJsonDirectory(sourceConstellations, "Constellation"),
  ]);

  if (dreamEntries.length === 0) {
    fail("The selected library contains no dream JSON files.");
  }

  dreamEntries.forEach(validateDream);
  const dreamIds = new Set(dreamEntries.map(({ value }) => value.id));
  if (dreamIds.size !== dreamEntries.length) {
    fail("The selected library contains duplicate dream ids.");
  }
  constellationEntries.forEach((entry) =>
    validateConstellation(entry, dreamIds),
  );

  const [existingDreams, existingConstellations] = await Promise.all([
    listJsonFiles(targetDreams),
    listJsonFiles(targetConstellations),
  ]);
  if (
    !forceImport &&
    (existingDreams.length > 0 || existingConstellations.length > 0)
  ) {
    fail(
      "This Atlas already contains memories. Re-run with --force only if replacing them is intentional.",
    );
  }

  await Promise.all([
    mkdir(targetDreams, { recursive: true }),
    mkdir(targetConstellations, { recursive: true }),
  ]);

  if (forceImport) {
    await Promise.all([
      ...existingDreams.map((name) =>
        rm(path.join(targetDreams, name), { force: true }),
      ),
      ...existingConstellations.map((name) =>
        rm(path.join(targetConstellations, name), { force: true }),
      ),
    ]);
  }

  await Promise.all([
    ...dreamEntries.map(({ name }) =>
      copyFile(path.join(sourceDreams, name), path.join(targetDreams, name)),
    ),
    ...constellationEntries.map(({ name }) =>
      copyFile(
        path.join(sourceConstellations, name),
        path.join(targetConstellations, name),
      ),
    ),
  ]);

  console.log(
    `Imported ${dreamEntries.length} dreams and ${constellationEntries.length} constellations from ${resolvedSource.sourcePath}.`,
  );
  } finally {
    await resolvedSource.cleanup();
  }
}

importLibrary().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Dream library import failed.",
  );
  process.exitCode = 1;
});
