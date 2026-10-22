import { expect, test } from "@playwright/test";
import common from "../src/i18n/locales/es/common.json" with { type: "json" };
import landing from "../src/i18n/locales/es/landing.json" with { type: "json" };

test("landing home renders its title", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: landing.placeholder.title }),
  ).toBeVisible();
});

test("business portal sends a signed-out visitor to sign-in", async ({
  page,
}) => {
  await page.goto("/business");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fbusiness$/);
  await expect(
    page.getByRole("heading", { name: common.auth.signIn.title }),
  ).toBeVisible();
});
