import { randomUUID } from "node:crypto";

import {
  createUserViaApi,
  deleteUserViaApi,
  type TestUser,
} from "../helpers/api.helper";
import {
  test,
  expect,
} from "../fixtures/test.fixture";

const testUser: TestUser = {
  email: `block4-${randomUUID()}@dreamatlas.test`,
  password: "Playwright123!",
};

let testUserId: string | undefined;

test.describe("Dream memory authentication", () => {
  test.beforeAll(async ({ request }) => {
    testUserId = await createUserViaApi(request, testUser);
  });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login(testUser.email, testUser.password);
  });

  test.afterAll(async ({ request }) => {
    if (testUserId) {
      await deleteUserViaApi(request, testUserId);
    }
  });

  test("@smoke displays the protected dream memory", async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/dreams$/);

    await expect(
      page.getByRole("heading", {
        name: "Your memory, preserved.",
      }),
    ).toBeVisible();
  });
});