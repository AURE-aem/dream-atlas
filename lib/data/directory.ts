import path from "node:path";

export function getDreamAtlasDataDirectory(
  collection: "dreams" | "constellations" | "users",
): string {
  const configuredRoot = process.env.DREAM_ATLAS_DATA_DIR?.trim();
  const dataRoot = configuredRoot
    ? path.resolve(configuredRoot)
    : path.join(process.cwd(), "data");

  return path.join(dataRoot, collection);
}
