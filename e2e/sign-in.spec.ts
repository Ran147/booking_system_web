import { expect, test } from "@playwright/test";
import { seedEmulators } from "./seedEmulators";
import { SEED_USER } from "../scripts/constants/SeedEmulator.constants";
import business from "../src/i18n/locales/es/business.json" with { type: "json" };
import common from "../src/i18n/locales/es/common.json" with { type: "json" };

// US-33: real sign-in against the emulators with Google's test reCAPTCHA,
// which always passes after ticking the box.
test.describe.configure({ mode: "serial" });

test.beforeAll(seedEmulators);

test("AC-KAN-33-03: a subscriber signs in from a protected page and returns to it", async ({
  page,
}) => {
  await page.goto("/business");
  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fbusiness$/);

  await page
    .getByLabel(common.auth.signIn.emailLabel, { exact: true })
    .fill(SEED_USER.SUBSCRIBER.EMAIL);
  await page
    .getByLabel(common.auth.signIn.passwordLabel, { exact: true })
    .fill(SEED_USER.SUBSCRIBER.PASSWORD);

  const recaptchaCheckbox = page
    .frameLocator('iframe[title="reCAPTCHA"]')
    .locator("#recaptcha-anchor");
  await recaptchaCheckbox.click();
  await expect(recaptchaCheckbox).toHaveAttribute("aria-checked", "true");

  await page
    .getByRole("button", { name: common.auth.signIn.submitAction })
    .click();

  await expect(page).toHaveURL(/\/business$/);
  await expect(
    page.getByRole("heading", { name: business.placeholder.title }),
  ).toBeVisible();
});

test("AC-KAN-34-04: a wrong password shows the neutral message", async ({
  page,
}) => {
  await page.goto("/sign-in");

  await page
    .getByLabel(common.auth.signIn.emailLabel, { exact: true })
    .fill(SEED_USER.SUBSCRIBER.EMAIL);
  await page
    .getByLabel(common.auth.signIn.passwordLabel, { exact: true })
    .fill("wrong-password");
  await page
    .frameLocator('iframe[title="reCAPTCHA"]')
    .locator("#recaptcha-anchor")
    .click();
  await page
    .getByRole("button", { name: common.auth.signIn.submitAction })
    .click();

  await expect(page.getByRole("alert")).toHaveText(
    common.auth.signIn.invalidCredentials,
  );
  await expect(page).toHaveURL(/\/sign-in$/);
});
