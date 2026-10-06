import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { CUSTOMER_SESSION } from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import { BookingRemindersPage } from "../ReservationRemindersPage";
import { createBookingRemindersPage } from "./BookingRemindersPage.page";
import { fetchBookingReminderPreference } from "../api/fetchReservationReminderPreference";
import { updateBookingReminderPreference } from "../api/updateReservationReminderPreference";

vi.mock("../api/fetchReservationReminderPreference");
vi.mock("../api/updateReservationReminderPreference");

const renderPage = (): void => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={testI18n}>
        <AuthContext.Provider value={{ session: CUSTOMER_SESSION }}>
          <BookingRemindersPage />
        </AuthContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
};

describe("KAN-203 booking reminder preference", () => {
  beforeEach(() => {
    vi.mocked(fetchBookingReminderPreference).mockResolvedValue(true);
    vi.mocked(updateBookingReminderPreference).mockResolvedValue(undefined);
  });

  it("AC-KAN-203-01: shows the current enabled preference", async () => {
    renderPage();
    const page = createBookingRemindersPage();

    expect(await page.findStatus(true)).toBeInTheDocument();
    expect(page.getToggle()).toHaveAttribute("aria-checked", "true");
  });

  it("AC-KAN-203-02: disables reminders and persists the change", async () => {
    renderPage();
    const page = createBookingRemindersPage();
    await page.findStatus(true);

    await page.clickToggle();

    expect(await page.findStatus(false)).toBeInTheDocument();
    expect(updateBookingReminderPreference).toHaveBeenCalledWith({
      isEnabled: false,
      userId: CUSTOMER_SESSION.userId,
    });
  });

  it("AC-KAN-203-03: enables reminders and persists the change", async () => {
    vi.mocked(fetchBookingReminderPreference).mockResolvedValue(false);
    renderPage();
    const page = createBookingRemindersPage();
    await page.findStatus(false);

    await page.clickToggle();

    expect(await page.findStatus(true)).toBeInTheDocument();
    expect(updateBookingReminderPreference).toHaveBeenCalledWith({
      isEnabled: true,
      userId: CUSTOMER_SESSION.userId,
    });
  });

  it("AC-KAN-203-04: restores the previous value when persistence fails", async () => {
    vi.mocked(updateBookingReminderPreference).mockRejectedValue(
      new Error("network"),
    );
    renderPage();
    const page = createBookingRemindersPage();
    await page.findStatus(true);

    await page.clickToggle();

    await waitFor(() =>
      expect(page.getToggle()).toHaveAttribute("aria-checked", "true"),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("customer:profile.reminders.saveError"),
    );
  });
});
