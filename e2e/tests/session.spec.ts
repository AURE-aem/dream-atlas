import {
  test,
  expect,
} from "@playwright/test";

test("@smoke opens dream memory with saved session", async ({
  page,
}) => {
  await page.goto("/dreams");

  await expect(page).toHaveURL(/\/dreams$/);

  await expect(
    page.getByRole("heading", {
      name: "Your memory, preserved.",
    }),
  ).toBeVisible();
});