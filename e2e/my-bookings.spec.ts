import { expect, test, type Locator, type Page } from "@playwright/test";
import { seedEmulators } from "./seedEmulators";
import {
  SEED_BUSINESS,
  SEED_USER,
} from "../scripts/constants/SeedEmulator.constants";
import common from "../src/i18n/locales/es/common.json" with { type: "json" };
import customer from "../src/i18n/locales/es/customer.json" with { type: "json" };

// KAN-150: the seeded customer has 4 upcoming and 4 past or cancelled
// bookings at one business. Real queries run against the emulators.
const MY_BOOKINGS_PATH = `/${SEED_BUSINESS.SLUG}/my-bookings`;
const UPCOMING_COUNT = 4;
const HISTORY_COUNT = 4;

test.describe.configure({ mode: "serial" });

test.beforeAll(seedEmulators);

const signInAsCustomer = async (page: Page): Promise<void> => {
  await page.goto(MY_BOOKINGS_PATH);
  await expect(page).toHaveURL(/\/sign-in\?redirectTo=/);

  await page
    .getByLabel(common.auth.signIn.emailLabel, { exact: true })
    .fill(SEED_USER.CUSTOMER.EMAIL);
  await page
    .getByLabel(common.auth.signIn.passwordLabel, { exact: true })
    .fill(SEED_USER.CUSTOMER.PASSWORD);
  const recaptchaCheckbox = page
    .frameLocator('iframe[title="reCAPTCHA"]')
    .locator("#recaptcha-anchor");
  await recaptchaCheckbox.click();
  await expect(recaptchaCheckbox).toHaveAttribute("aria-checked", "true");
  await page
    .getByRole("button", { name: common.auth.signIn.submitAction })
    .click();

  await expect(page).toHaveURL(new RegExp(`${MY_BOOKINGS_PATH}`));
};

const bodyRows = (page: Page): Locator =>
  page
    .getByRole("table", { name: customer.myBookings.list.label })
    .getByRole("row")
    .filter({ has: page.getByRole("cell") });

test("AC-KAN-151-01 and AC-KAN-153-01: lists the upcoming bookings and the history", async ({
  page,
}) => {
  await signInAsCustomer(page);

  await expect(bodyRows(page)).toHaveCount(UPCOMING_COUNT);

  await page
    .getByRole("tab", { name: customer.myBookings.tabs.history })
    .click();

  await expect(bodyRows(page)).toHaveCount(HISTORY_COUNT);
});

test("AC-KAN-154-01 and AC-KAN-154-04: a status filter lives in the URL and survives a reload", async ({
  page,
}) => {
  await signInAsCustomer(page);

  await page
    .getByLabel(customer.myBookings.filters.status)
    .selectOption({ label: common.bookingStatus.pending });

  await expect(page).toHaveURL(/status=pending/);
  await expect(bodyRows(page)).toHaveCount(1);

  await page.reload();

  await expect(page.getByLabel(customer.myBookings.filters.status)).toHaveValue(
    "pending",
  );
  await expect(bodyRows(page)).toHaveCount(1);

  await page
    .getByRole("button", { name: customer.myBookings.filters.clearAction })
    .click();

  await expect(bodyRows(page)).toHaveCount(UPCOMING_COUNT);
  await expect(page).not.toHaveURL(/status=/);
});

test("AC-KAN-154-01: the history filters by a status that is not open", async ({
  page,
}) => {
  await signInAsCustomer(page);
  await page
    .getByRole("tab", { name: customer.myBookings.tabs.history })
    .click();

  await page
    .getByLabel(customer.myBookings.filters.status)
    .selectOption({ label: common.bookingStatus.cancelled });

  await expect(bodyRows(page)).toHaveCount(2);
});

test("AC-KAN-154-03: filters by business", async ({ page }) => {
  await signInAsCustomer(page);

  await page
    .getByLabel(customer.myBookings.filters.business)
    .selectOption({ label: SEED_BUSINESS.NAME });

  await expect(page).toHaveURL(/business=/);
  await expect(bodyRows(page)).toHaveCount(UPCOMING_COUNT);
});

test("AC-KAN-154-02 and AC-KAN-154-05: a date range with no bookings shows the empty message", async ({
  page,
}) => {
  await signInAsCustomer(page);
  await page
    .getByRole("tab", { name: customer.myBookings.tabs.history })
    .click();

  await page.getByLabel(customer.myBookings.filters.from).fill("2000-01-01");
  await page.getByLabel(customer.myBookings.filters.to).fill("2000-01-31");

  await expect(
    page.getByText(customer.myBookings.filters.noResultsEmpty),
  ).toBeVisible();
});

test("AC-KAN-154-06: an end date before the start shows the error", async ({
  page,
}) => {
  await signInAsCustomer(page);
  await page
    .getByRole("tab", { name: customer.myBookings.tabs.history })
    .click();

  await page.getByLabel(customer.myBookings.filters.from).fill("2026-10-10");
  await page.getByLabel(customer.myBookings.filters.to).fill("2026-10-01");

  await expect(
    page.getByText(customer.myBookings.filters.invalidRangeError),
  ).toBeVisible();
});

test("AC-KAN-152-01: opens the detail of a booking", async ({ page }) => {
  await signInAsCustomer(page);

  await bodyRows(page)
    .first()
    .getByRole("link", { name: customer.myBookings.list.detailAction })
    .click();

  await expect(page).toHaveURL(
    new RegExp(`/${SEED_BUSINESS.SLUG}/my-bookings/seed-booking-`),
  );
  await expect(
    page.getByRole("heading", { name: customer.myBookings.detail.title }),
  ).toBeVisible();
  await expect(page.getByText(SEED_USER.COLLABORATOR.FULL_NAME)).toBeVisible();
});
