import {
  mkdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { test as setup } from "@playwright/test";

import {
  authDirectory,
  authUserMetadataPath,
  storageStatePath,
} from "../helpers/auth-state";
import {
  createUserViaApi,
  deleteUserViaApi,
  type TestUser,
} from "../helpers/api.helper";
import { LoginPage } from "../pages/LoginPage";

const testUser: TestUser = {
  email: `storage-state-${randomUUID()}@dreamatlas.test`,
  password: "StorageState123!",
};

setup("create authenticated storage state", async ({
  page,
  request,
}) => {
  let userId: string | undefined;

  await mkdir(authDirectory, {
    recursive: true,
  });

  try {
    userId = await createUserViaApi(request, testUser);

    await writeFile(
      authUserMetadataPath,
      JSON.stringify({ userId }, null, 2),
      "utf8",
    );

    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(testUser.email, testUser.password);

    await page.context().storageState({
      path: storageStatePath,
    });
  } catch (error) {
    if (userId) {
      await deleteUserViaApi(request, userId);
    }

    await rm(authDirectory, {
      recursive: true,
      force: true,
    });

    throw error;
  }
});