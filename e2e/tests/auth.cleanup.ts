import {
  readFile,
  rm,
} from "node:fs/promises";

import { test as cleanup } from "@playwright/test";

import {
  authDirectory,
  authUserMetadataPath,
  type AuthUserMetadata,
} from "../helpers/auth-state";
import { deleteUserViaApi } from "../helpers/api.helper";

cleanup("delete storage state test user", async ({
  request,
}) => {
  try {
    const metadata = JSON.parse(
      await readFile(authUserMetadataPath, "utf8"),
    ) as AuthUserMetadata;

    await deleteUserViaApi(request, metadata.userId);
  } finally {
    await rm(authDirectory, {
      recursive: true,
      force: true,
    });
  }
});