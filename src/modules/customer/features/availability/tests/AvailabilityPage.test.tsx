import { screen } from "@testing-library/react";
import { FunctionsError } from "firebase/functions";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as FirebaseServices from "@/services/firebase";
import { CUSTOMER_SESSION, renderRoutesWithProviders } from "@/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import { formatTime } from "@/utils";
import { createAvailabilityPage } from "./AvailabilityPage.page";
import * as fetchBookingContextModule from "../api/fetchBookingContext";
import { AvailabilityPage } from "../components/AvailabilityPage/AvailabilityPage";
import type { BookingContext } from "../models/availability.model";
import { addCalendarDays, formatZonedDate } from "../utils/calendarDate";

const callFunctionMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/firebase", async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseServices>()),
  callFunction: callFunctionMock,
}));

const TIME_ZONE = "America/Costa_Rica";
const OPEN = [{ closesAt: "18:00", opensAt: "09:00" }];
const OPEN_EVERY_DAY = Object.fromEntries(
  [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ].map((weekday) => [weekday, OPEN]),
);
const CONTEXT: BookingContext = {
  businessHours: OPEN_EVERY_DAY,
  businessId: "business-1",
  currency: "CRC",
  durationMinutes: 45,
  serviceId: "service-1",
  serviceName: "Corte de cabello",
  timeZone: TIME_ZONE,
};
const TODAY = formatZonedDate(new Date(), TIME_ZONE);
const TOMORROW = addCalendarDays(TODAY, 1);
const PAGE_PATH = "/barberia-centro/book/service-1";
const SLOT_START = `${TOMORROW}T16:00:00.000Z`;
const SLOT = { endsAt: `${TOMORROW}T16:45:00.000Z`, startsAt: SLOT_START };

const answerFor = (
  date: string,
  slots: unknown[],
): Record<string, unknown> => ({
  date,
  slots,
  timeZone: TIME_ZONE,
});

const slotsByDate = (slotsOfDay: Record<string, unknown[]>): void => {
  callFunctionMock.mockImplementation(
    async (_name: string, payload: { date: string }) =>
      answerFor(payload.date, slotsOfDay[payload.date] ?? []),
  );
};

const reasonError = (reason: string): FunctionsError =>
  new FunctionsError("failed-precondition", "message", { reason });

const renderPage = (
  path = PAGE_PATH,
): ReturnType<typeof renderRoutesWithProviders> =>
  renderRoutesWithProviders(
    [
      { element: <AvailabilityPage />, path: "/:businessSlug/book/:serviceId" },
      { element: <p>services step</p>, path: "/:businessSlug/book" },
      {
        element: <p>confirm step</p>,
        path: "/:businessSlug/book/:serviceId/confirm",
      },
    ],
    { initialPath: path, session: CUSTOMER_SESSION },
  );

const slotLabel = (startsAt: string): string =>
  formatTime(new Date(startsAt), TIME_ZONE, testI18n.language);

describe("AvailabilityPage (KAN-140 to KAN-143)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    callFunctionMock.mockReset();
    vi.spyOn(
      fetchBookingContextModule,
      "fetchBookingContext",
    ).mockResolvedValue(CONTEXT);
  });

  it("AC-KAN-140-07 and AC-KAN-140-01: preselects the first day with free slots and shows them", async () => {
    slotsByDate({ [TOMORROW]: [SLOT] });
    const page = createAvailabilityPage();

    renderPage();

    expect(await page.findSlotLabels()).toEqual([slotLabel(SLOT_START)]);
    // Tomorrow is the second day of the week, which starts today.
    expect(screen.getAllByRole("button", { pressed: true })).toEqual([
      page.getDayButtons()[1],
    ]);
    expect(callFunctionMock).toHaveBeenCalledWith(
      "getAvailability",
      expect.objectContaining({ date: TOMORROW, serviceId: "service-1" }),
    );
  });

  it("AC-KAN-140-06: says the times are in the business time zone", async () => {
    slotsByDate({ [TODAY]: [SLOT] });

    renderPage();

    expect(
      await screen.findByText(
        testI18n.t("customer:availability.timeZoneNote", {
          timeZone: TIME_ZONE,
        }),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-140-04: the week starts today and there is no previous week", async () => {
    slotsByDate({ [TODAY]: [SLOT] });
    const page = createAvailabilityPage();

    renderPage();

    await page.findSlotLabels();
    expect(page.getPreviousWeekButton()).toBeDisabled();
    expect(page.getDayButtons()).toHaveLength(7);
  });

  it("AC-KAN-143-03: a weekday without business hours cannot be picked", async () => {
    const closedWeekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "long",
    })
      .format(new Date(`${TOMORROW}T12:00:00.000Z`))
      .toLowerCase();
    vi.spyOn(
      fetchBookingContextModule,
      "fetchBookingContext",
    ).mockResolvedValue({
      ...CONTEXT,
      businessHours: { ...OPEN_EVERY_DAY, [closedWeekday]: [] },
    });
    slotsByDate({ [TODAY]: [SLOT] });
    const page = createAvailabilityPage();

    renderPage();

    await page.findSlotLabels();
    expect(page.getDayButtons()[1]).toBeDisabled();
  });

  it("AC-KAN-141-08: a day without free slots says so", async () => {
    slotsByDate({});

    renderPage(`${PAGE_PATH}?date=${TODAY}`);

    expect(
      await screen.findByText(
        testI18n.t("customer:availability.slots.emptyDay"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-140-02: a network error shows the message and a retry that loads the slots", async () => {
    callFunctionMock.mockRejectedValueOnce(
      new FunctionsError("unavailable", "offline"),
    );
    const page = createAvailabilityPage();

    renderPage(`${PAGE_PATH}?date=${TOMORROW}`);

    expect(
      await screen.findByText(testI18n.t("errors.network")),
    ).toBeInTheDocument();
    slotsByDate({ [TOMORROW]: [SLOT] });
    await page.clickRetry();
    expect(await page.findSlotLabels()).toEqual([slotLabel(SLOT_START)]);
  });

  it("AC-KAN-141-03: an answer that breaks the contract never shows slots", async () => {
    callFunctionMock.mockResolvedValue({ date: TOMORROW, slots: "wrong" });

    renderPage(`${PAGE_PATH}?date=${TOMORROW}`);

    expect(
      await screen.findByText(testI18n.t("errors.unknown")),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("AC-KAN-140-03: a deactivated service offers to go back to the services", async () => {
    callFunctionMock.mockRejectedValue(reasonError("service_unavailable"));
    const page = createAvailabilityPage();

    const { router } = renderPage(`${PAGE_PATH}?date=${TOMORROW}`);

    expect(
      await screen.findByText(
        testI18n.t("customer:availability.errors.serviceUnavailable"),
      ),
    ).toBeInTheDocument();
    await page.clickBackToServices();
    expect(router.state.location.pathname).toBe("/barberia-centro/book");
  });

  it("AC-KAN-143-04: a business without business hours shows not configured, without retry", async () => {
    callFunctionMock.mockRejectedValue(reasonError("not_configured"));

    renderPage(`${PAGE_PATH}?date=${TOMORROW}`);

    expect(
      await screen.findByText(
        testI18n.t("customer:availability.slots.notConfigured"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: testI18n.t("customer:availability.retryAction"),
      }),
    ).not.toBeInTheDocument();
  });

  it("AC-KAN-143-07: an inactive business offers no slots", async () => {
    callFunctionMock.mockRejectedValue(reasonError("business_unavailable"));

    renderPage(`${PAGE_PATH}?date=${TOMORROW}`);

    expect(
      await screen.findByText(
        testI18n.t("customer:availability.errors.businessUnavailable"),
      ),
    ).toBeInTheDocument();
  });

  it("continues to the confirmation with the chosen slot only after choosing one", async () => {
    slotsByDate({ [TOMORROW]: [SLOT] });
    const page = createAvailabilityPage();

    const { router } = renderPage(`${PAGE_PATH}?date=${TOMORROW}`);

    await page.findSlotLabels();
    expect(page.getContinueButton()).toBeDisabled();
    await page.chooseSlot(slotLabel(SLOT_START));
    await page.clickContinue();
    expect(router.state.location.pathname).toBe(
      "/barberia-centro/book/service-1/confirm",
    );
    expect(
      new URLSearchParams(router.state.location.search).get("startsAt"),
    ).toBe(SLOT_START);
  });
});
