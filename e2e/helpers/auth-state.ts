import path from "node:path";

export const authDirectory = path.resolve(
  process.cwd(),
  "playwright/.auth",
);

export const storageStatePath = path.join(
  authDirectory,
  "user.json",
);

export const authUserMetadataPath = path.join(
  authDirectory,
  "test-user.json",
);

export type AuthUserMetadata = {
  userId: string;
};