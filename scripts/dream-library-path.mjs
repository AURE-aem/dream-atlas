import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import extractZip from "extract-zip";

const DEFAULT_LIBRARY_NAME = "Dream-Atlas-Demo-Dream-Library-v1";

async function isDreamLibrary(directory) {
  try {
    await Promise.all([
      access(path.join(directory, "dreams")),
      access(path.join(directory, "constellations")),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function resolveDreamLibraryDirectory(
  sourceArgument = DEFAULT_LIBRARY_NAME,
  { cwd = process.cwd(), ancestorLimit = 4 } = {},
) {
  const candidates = buildLibraryCandidates(sourceArgument, cwd, ancestorLimit);

  for (const candidate of candidates) {
    if (await isDreamLibrary(candidate)) return candidate;
  }

  throw createResolutionError(candidates, []);
}

export async function materializeDreamLibrarySource(
  sourceArgument = DEFAULT_LIBRARY_NAME,
  {
    cwd = process.cwd(),
    ancestorLimit = 4,
    temporaryRoot = tmpdir(),
  } = {},
) {
  const directoryCandidates = buildLibraryCandidates(
    sourceArgument,
    cwd,
    ancestorLimit,
  );
  const zipCandidates = directoryCandidates.map((candidate) => `${candidate}.zip`);
  const explicitZip = sourceArgument.toLowerCase().endsWith(".zip");
  const sourceCandidates = directoryCandidates.flatMap((directory, index) => {
    const candidates = [
      { kind: "directory", path: directory },
      { kind: "zip", path: `${directory}.zip` },
    ];
    return explicitZip && index === 0 ? candidates.reverse() : candidates;
  });

  for (const candidate of sourceCandidates) {
    if (
      candidate.kind === "directory" &&
      (await isDreamLibrary(candidate.path))
    ) {
      return {
        directory: candidate.path,
        sourcePath: candidate.path,
        kind: "directory",
        cleanup: async () => undefined,
      };
    }
    if (candidate.kind !== "zip" || !(await pathExists(candidate.path))) {
      continue;
    }

    const extractionRoot = await mkdtemp(
      path.join(temporaryRoot, "dream-atlas-library-"),
    );
    try {
      await extractZip(candidate.path, { dir: extractionRoot });
      const directory = await findDreamLibrary(extractionRoot, 3);
      if (!directory) {
        throw new Error(
          `The archive ${candidate.path} contains no dreams and constellations folders.`,
        );
      }
      return {
        directory,
        sourcePath: candidate.path,
        kind: "zip",
        cleanup: () => rm(extractionRoot, { force: true, recursive: true }),
      };
    } catch (error) {
      await rm(extractionRoot, { force: true, recursive: true });
      throw error;
    }
  }

  throw createResolutionError(directoryCandidates, zipCandidates);
}

function buildLibraryCandidates(sourceArgument, cwd, ancestorLimit) {
  const withoutZip = sourceArgument.toLowerCase().endsWith(".zip")
    ? sourceArgument.slice(0, -4)
    : sourceArgument;
  const requestedDirectory = path.resolve(cwd, withoutZip);
  const libraryName = path.basename(path.normalize(withoutZip));
  const candidates = [requestedDirectory];
  let ancestor = path.resolve(cwd);

  for (let level = 0; level <= ancestorLimit; level += 1) {
    candidates.push(path.join(ancestor, libraryName));
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }

  return [...new Set(candidates.map(path.normalize))];
}

async function findDreamLibrary(directory, remainingDepth) {
  if (await isDreamLibrary(directory)) return directory;
  if (remainingDepth === 0) return null;

  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const nested = await findDreamLibrary(
      path.join(directory, entry.name),
      remainingDepth - 1,
    );
    if (nested) return nested;
  }
  return null;
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createResolutionError(directoryCandidates, zipCandidates) {
  const checked = [
    ...directoryCandidates,
    ...zipCandidates,
  ]
    .map((candidate) => `  - ${candidate}`)
    .join("\n");
  return new Error(
    `Could not find a Dream Atlas library folder or ZIP with dreams and constellations folders.\nChecked:\n${checked}`,
  );
}
