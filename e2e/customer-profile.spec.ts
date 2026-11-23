import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { SEED_BUSINESS } from "../scripts/constants/SeedEmulator.constants";
import { FIREBASE_EMULATOR } from "../src/constants/firebase/FirebaseEmulator.constants";
import { LANGUAGE } from "../src/constants/i18n/Language.constants";
import customerEnglish from "../src/i18n/locales/en/customer.json" with { type: "json" };
import common from "../src/i18n/locales/es/common.json" with { type: "json" };
import customer from "../src/i18n/locales/es/customer.json" with { type: "json" };
import landing from "../src/i18n/locales/es/landing.json" with { type: "json" };

const BUSINESS_PATH = `/${SEED_BUSINESS.SLUG}`;
const PROFILE_PATH = `${BUSINESS_PATH}/profile`;
const PASSWORD = "Emulator-Only-Profile-169!";
const AUTH_ENDPOINT = `${FIREBASE_EMULATOR.AUTH_URL}/identitytoolkit.googleapis.com/v1`;
const DOCUMENT_ENDPOINT = `http://${FIREBASE_EMULATOR.HOST}:${FIREBASE_EMULATOR.PORT.FIRESTORE}/v1/projects/${FIREBASE_EMULATOR.DEMO_PROJECT_ID}/databases/(default)/documents/users`;
const FIRST_ACCOUNT = "kan169-first@demo.test";
const SECOND_ACCOUNT = "kan169-second@demo.test";
const LONG_EMAIL = `${"personal".repeat(18)}@firestore.demo.test`;
const LONG_NAME = "Customer".repeat(24);

// Fixtures use only emulator REST endpoints; no production account or bootstrap is changed.
const prepareAccount = async (
  request: APIRequestContext,
  email: string,
  fullName: string,
  profileEmail: string,
): Promise<void> => {
  const credentials = { email, password: PASSWORD, returnSecureToken: true };
  let response = await request.post(
    `${AUTH_ENDPOINT}/accounts:signUp?key=fake-key`,
    { ["data"]: credentials },
  );
  if (!response.ok())
    response = await request.post(
      `${AUTH_ENDPOINT}/accounts:signInWithPassword?key=fake-key`,
      { ["data"]: credentials },
    );
  expect(response.ok()).toBe(true);
  const account = (await response.json()) as { localId: string };
  const claimsResponse = await request.post(
    `${AUTH_ENDPOINT}/accounts:update?key=fake-key`,
    {
      headers: { Authorization: "Bearer owner" },
      ["data"]: {
        localId: account.localId,
        customAttributes: JSON.stringify({ role: "customer" }),
      },
    },
  );
  expect(claimsResponse.ok()).toBe(true);
  const profileResponse = await request.patch(
    `${DOCUMENT_ENDPOINT}/${account.localId}`,
    {
      headers: { Authorization: "Bearer owner" },
      ["data"]: {
        fields: {
          email: { stringValue: profileEmail },
          fullName: { stringValue: fullName },
          language: { stringValue: "es" },
          phone: { stringValue: "+506 8888-0169" },
          role: { stringValue: "customer" },
          theme: { stringValue: "system" },
        },
      },
    },
  );
  expect(profileResponse.ok()).toBe(true);
};

const signIn = async (page: Page, email: string): Promise<void> => {
  await expect(page).toHaveURL(/\/sign-in\?redirectTo=/);
  await page
    .getByLabel(common.auth.signIn.emailLabel, { exact: true })
    .fill(email);
  await page
    .getByLabel(common.auth.signIn.passwordLabel, { exact: true })
    .fill(PASSWORD);
  const checkbox = page
    .frameLocator('iframe[title="reCAPTCHA"]')
    .locator("#recaptcha-anchor");
  await checkbox.click();
  await expect(checkbox).toHaveAttribute("aria-checked", "true");
  await page
    .getByRole("button", { name: common.auth.signIn.submitAction })
    .click();
  await expect(page).toHaveURL(PROFILE_PATH);
};

test.beforeEach(async ({ request }) => {
  await prepareAccount(request, FIRST_ACCOUNT, LONG_NAME, LONG_EMAIL);
  await prepareAccount(
    request,
    SECOND_ACCOUNT,
    "Second Profile Customer",
    "second-profile@firestore.demo.test",
  );
});

test("KAN-169 AC-01 AC-08 AC-09: business access, login return and refresh read Firestore email", async ({
  page,
}) => {
  await page.goto(BUSINESS_PATH);
  await page
    .getByRole("link", { name: customer.profile.navigation.open })
    .click();
  await signIn(page, FIRST_ACCOUNT);
  await expect(page.getByRole("definition").nth(1)).toHaveText(LONG_EMAIL);
  await expect(page.getByRole("definition")).toHaveCount(3);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("definition").nth(0)).toHaveText(LONG_NAME);
  await page
    .getByRole("link", { name: customer.profile.navigation.back })
    .click();
  await expect(page).toHaveURL(BUSINESS_PATH);
  await expect(
    page.getByRole("link", { name: customer.myBookings.list.label }),
  ).toHaveAttribute("href", `${BUSINESS_PATH}/my-bookings`);
});

test("KAN-169 AC-10: logout then another customer never displays the previous profile", async ({
  page,
}) => {
  await page.goto(PROFILE_PATH);
  await signIn(page, FIRST_ACCOUNT);
  await expect(page.getByRole("definition").nth(1)).toHaveText(LONG_EMAIL);
  await page.goto("/");
  await page
    .getByRole("button", { name: landing.home.navbar.signOut, exact: true })
    .click();
  await page.goto(PROFILE_PATH);
  await signIn(page, SECOND_ACCOUNT);
  await expect(page.getByRole("definition").nth(1)).toHaveText(
    "second-profile@firestore.demo.test",
  );
  await expect(page.getByText(LONG_EMAIL, { exact: true })).toHaveCount(0);
});

test("KAN-169 AC-11: long values remain complete at 320px in both themes and locales", async ({
  page,
}) => {
  await page.goto(PROFILE_PATH);
  await signIn(page, FIRST_ACCOUNT);
  await page.setViewportSize({ width: 320, height: 740 });
  for (const theme of ["light", "dark"]) {
    for (const language of ["es", "en"]) {
      await page.evaluate(
        ({ theme, language }) => {
          localStorage.setItem("booking.theme", theme);
          localStorage.setItem("booking.language", language);
        },
        { theme, language },
      );
      await page.reload();
      const copy = language === LANGUAGE.ES ? customer : customerEnglish;
      await expect(
        page.getByRole("heading", { name: copy.profile.title, exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("definition").nth(0)).toHaveText(LONG_NAME);
      await expect(page.getByRole("definition").nth(1)).toHaveText(LONG_EMAIL);
      const returnLink = page.getByRole("link", {
        name: copy.profile.navigation.back,
      });
      await returnLink.focus();
      await expect(returnLink).toBeFocused();
      expect(
        await page.evaluate<boolean>(
          "document.documentElement.scrollWidth <= window.innerWidth",
        ),
      ).toBe(true);
      expect(
        await page.evaluate<boolean>(
          "Array.from(document.querySelectorAll('main dd')).every(element => element.scrollWidth <= element.clientWidth)",
        ),
      ).toBe(true);
      await page.screenshot({
        fullPage: true,
        path: test.info().outputPath(`profile-320-${theme}-${language}.png`),
      });
    }
  }
});
