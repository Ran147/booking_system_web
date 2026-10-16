import { expect, test, type Page } from "@playwright/test";
import { seedEmulators } from "./seedEmulators";
import { SEED_USER } from "../scripts/constants/SeedEmulator.constants";
import { FIREBASE_EMULATOR } from "../src/constants/firebase/FirebaseEmulator.constants";
import common from "../src/i18n/locales/es/common.json" with { type: "json" };

// US-36 (KAN-36, KAN-37): the whole recovery against the emulators. The Auth
// emulator keeps the reset links it was asked to send, so the test reads the
// link from there instead of an inbox.
test.describe.configure({ mode: "serial" });

test.beforeAll(seedEmulators);

const AUTH_EMULATOR_URL = FIREBASE_EMULATOR.AUTH_URL;
const PROJECT_ID = FIREBASE_EMULATOR.DEMO_PROJECT_ID;
const UNKNOWN_EMAIL = "nadie-registrado@demo.test";
const NEW_PASSWORD = "Nueva-Clave-456!";
const RESET_REQUEST_TYPE = "PASSWORD_RESET";
const RESET_EMAIL = `recuperacion-${Date.now()}@demo.test`;

// The emulator forgets a link once it is used: the second test keeps it.
let usedResetCode = "";

interface OobCode {
  readonly email: string;
  readonly oobCode: string;
  readonly requestType: string;
}

const readResetCodes = async (email: string): Promise<OobCode[]> => {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/emulator/v1/projects/${PROJECT_ID}/oobCodes`,
  );
  const { oobCodes } = (await response.json()) as { oobCodes: OobCode[] };

  return oobCodes.filter(
    (oobCode) =>
      oobCode.email === email && oobCode.requestType === RESET_REQUEST_TYPE,
  );
};

// A throwaway account, so the seed accounts other specs sign in with keep
// their password.
const createAccount = async (email: string): Promise<void> => {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,
    {
      body: JSON.stringify({
        email,
        password: SEED_USER.CUSTOMER.PASSWORD,
        returnSecureToken: false,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
  expect(response.ok).toBe(true);
};

const requestRecovery = async (page: Page, email: string): Promise<void> => {
  await page.goto("/password-recovery");
  await page
    .getByLabel(common.auth.passwordRecovery.emailLabel, { exact: true })
    .fill(email);
  const recaptchaCheckbox = page
    .frameLocator('iframe[title="reCAPTCHA"]')
    .locator("#recaptcha-anchor");
  await recaptchaCheckbox.click();
  await expect(recaptchaCheckbox).toHaveAttribute("aria-checked", "true");
  await page
    .getByRole("button", { name: common.auth.passwordRecovery.submitAction })
    .click();
};

test.beforeAll(async () => {
  await createAccount(RESET_EMAIL);
});

test("AC-KAN-36-02: an existing account and an unknown email get the same neutral message", async ({
  page,
}) => {
  await requestRecovery(page, UNKNOWN_EMAIL);
  await expect(
    page.getByText(common.auth.passwordReset.requestSent),
  ).toBeVisible();
  expect(await readResetCodes(UNKNOWN_EMAIL)).toHaveLength(0);

  await requestRecovery(page, RESET_EMAIL);
  await expect(
    page.getByText(common.auth.passwordReset.requestSent),
  ).toBeVisible();
  await expect
    .poll(async () => (await readResetCodes(RESET_EMAIL)).length)
    .toBe(1);
});

test("AC-KAN-37-02: the emailed link lets the user choose a new password and go back to sign-in", async ({
  page,
}) => {
  const [resetCode] = await readResetCodes(RESET_EMAIL);
  if (!resetCode) throw new Error("No reset link was sent");
  usedResetCode = resetCode.oobCode;

  await page.goto(
    `/password-reset?mode=resetPassword&oobCode=${resetCode.oobCode}`,
  );
  await page
    .getByLabel(common.auth.passwordReset.newPasswordLabel, { exact: true })
    .fill(NEW_PASSWORD);
  await page
    .getByLabel(common.auth.passwordReset.confirmationLabel, { exact: true })
    .fill(NEW_PASSWORD);
  await page
    .getByRole("button", { name: common.auth.passwordReset.submitAction })
    .click();

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByText(common.auth.passwordReset.success)).toBeVisible();
});

test("AC-KAN-37-05: the same link cannot be used twice", async ({ page }) => {
  await page.goto(
    `/password-reset?mode=resetPassword&oobCode=${usedResetCode}`,
  );

  await expect(
    page.getByText(common.auth.passwordReset.linkInvalid),
  ).toBeVisible();
});
