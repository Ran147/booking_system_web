import { expect, test } from "@playwright/test";
import { SEED_USER } from "../scripts/constants/SeedEmulator.constants";
import business from "../src/i18n/locales/es/business.json" with { type: "json" };
import common from "../src/i18n/locales/es/common.json" with { type: "json" };

// US-33 (AC-KAN-33-09, AC-KAN-39-07): the owner of the seed's pending
// business sees only the "under review" screen, on any business URL.
test("AC-KAN-33-09: a pending business owner sees only the under-review screen", async ({
  page,
}) => {
  await page.goto("/sign-in");

  await page
    .getByLabel(common.auth.signIn.emailLabel, { exact: true })
    .fill(SEED_USER.PENDING_SUBSCRIBER.EMAIL);
  await page
    .getByLabel(common.auth.signIn.passwordLabel, { exact: true })
    .fill(SEED_USER.PENDING_SUBSCRIBER.PASSWORD);

  const recaptchaCheckbox = page
    .frameLocator('iframe[title="reCAPTCHA"]')
    .locator("#recaptcha-anchor");
  await recaptchaCheckbox.click();
  await expect(recaptchaCheckbox).toHaveAttribute("aria-checked", "true");

  await page
    .getByRole("button", { name: common.auth.signIn.submitAction })
    .click();

  const pendingTitle = page.getByRole("heading", {
    level: 1,
    name: business.pendingApproval.title,
  });
  await expect(page).toHaveURL(/\/business$/);
  await expect(pendingTitle).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);

  await page.goto("/business/services");
  await expect(pendingTitle).toBeVisible();
  await expect(
    page.getByRole("heading", { name: business.services.list.title }),
  ).toHaveCount(0);

  await page
    .getByRole("button", { name: business.layout.statusGate.signOutAction })
    .click();
  await expect(page).toHaveURL(/\/sign-in(\?|$)/);
});
