import {
  test as base,
  expect,
} from "@playwright/test";

import { LoginPage } from "../pages/LoginPage";

type DreamAtlasFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<DreamAtlasFixtures>({
  loginPage: async ({ page }, provide) => {
    await provide(new LoginPage(page));
  },
});

export { expect };