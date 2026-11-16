import { expect, test } from "@playwright/test";
import { SEED_USER } from "../scripts/constants/SeedEmulator.constants";
import admin from "../src/i18n/locales/es/admin.json" with { type: "json" };
import common from "../src/i18n/locales/es/common.json" with { type: "json" };

// KAN-204: Super Admin sign-in to the backoffice (/admin) against the emulators.
test.describe.configure({ mode: "serial" });

test("AC-KAN-204-01 & AC-KAN-204-02: super admin signs in and accesses the backoffice (/admin)", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fadmin$/);

  await page
    .getByLabel(common.auth.signIn.emailLabel, { exact: true })
    .fill(SEED_USER.SUPER_ADMIN.EMAIL);
  await page
    .getByLabel(common.auth.signIn.passwordLabel, { exact: true })
    .fill(SEED_USER.SUPER_ADMIN.PASSWORD);

  const recaptchaCheckbox = page
    .frameLocator('iframe[title="reCAPTCHA"]')
    .locator("#recaptcha-anchor");
  await recaptchaCheckbox.click();
  await expect(recaptchaCheckbox).toHaveAttribute("aria-checked", "true");

  await page
    .getByRole("button", { name: common.auth.signIn.submitAction })
    .click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: admin.placeholder.title }),
  ).toBeVisible();
});
