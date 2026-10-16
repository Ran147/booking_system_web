import { screen } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS } from "@/domain";
import {
  CUSTOMER_SESSION,
  renderWithProviders,
  SUBSCRIBER_SESSION,
} from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createMyBookingsPage } from "./MyBookingsPage.page";
import * as fetchBookingBusinessModule from "../api/fetchBookingBusiness";
import * as fetchCustomerBusinessIdsModule from "../api/fetchCustomerBusinessIds";
import * as fetchMyBookingsPageModule from "../api/fetchMyBookingsPage";
import { MyBookingsPage } from "../components/MyBookingsPage";
import { MY_BOOKINGS_TAB } from "../constants";
import type { BookingBusiness, MyBooking } from "../models";

const MY_BOOKINGS_PATH = "/barberia-centro/my-bookings";
const MEXICO_BUSINESS: BookingBusiness = {
  currency: "MXN",
  id: "business-a",
  name: "Barbería Centro",
  slug: "barberia-centro",
  timeZone: "America/Mexico_City",
};
const SPAIN_BUSINESS: BookingBusiness = {
  currency: "EUR",
  id: "business-b",
  name: "Peluquería Sol",
  slug: "peluqueria-sol",
  timeZone: "Europe/Madrid",
};

const buildBooking = (overrides: Partial<MyBooking> = {}): MyBooking => ({
  businessId: MEXICO_BUSINESS.id,
  cancellation: null,
  collaboratorName: null,
  durationMinutes: 45,
  endsAt: new Date("2026-11-02T16:45:00.000Z"),
  id: "booking-1",
  priceInCents: 25_000,
  serviceName: "Corte de cabello",
  startsAt: new Date("2026-11-02T16:00:00.000Z"),
  status: BOOKING_STATUS.CONFIRMED,
  ...overrides,
});

const buildPage = (
  items: MyBooking[],
  overrides: { nextCursor?: QueryDocumentSnapshot; totalCount?: number } = {},
): Awaited<
  ReturnType<typeof fetchMyBookingsPageModule.fetchMyBookingsPage>
> => ({
  items,
  nextCursor: overrides.nextCursor ?? null,
  totalCount: overrides.totalCount ?? items.length,
});

const renderMyBookings = (initialPath = MY_BOOKINGS_PATH): void => {
  renderWithProviders(<MyBookingsPage />, {
    initialPath,
    session: CUSTOMER_SESSION,
  });
};

describe("MyBookingsPage (KAN-151, KAN-153)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(
      fetchCustomerBusinessIdsModule,
      "fetchCustomerBusinessIds",
    ).mockResolvedValue([MEXICO_BUSINESS.id, SPAIN_BUSINESS.id]);
    vi.spyOn(
      fetchBookingBusinessModule,
      "fetchBookingBusiness",
    ).mockImplementation((businessId) =>
      Promise.resolve(
        businessId === SPAIN_BUSINESS.id ? SPAIN_BUSINESS : MEXICO_BUSINESS,
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-151-01: lists upcoming bookings with business, service, local time and status", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValue(
        buildPage([
          buildBooking(),
          buildBooking({
            businessId: SPAIN_BUSINESS.id,
            id: "booking-2",
            serviceName: "Arreglo de barba",
            status: BOOKING_STATUS.PENDING,
          }),
        ]),
      );
    renderMyBookings();

    const rows = await createMyBookingsPage().findRows();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        customerUserId: CUSTOMER_SESSION.userId,
        tab: MY_BOOKINGS_TAB.UPCOMING,
      }),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Barbería Centro");
    expect(rows[0]).toHaveTextContent("Corte de cabello");
    expect(rows[0]).toHaveTextContent(/10:00/);
    expect(rows[0]).toHaveTextContent(
      testI18n.t("common:bookingStatus.confirmed"),
    );
    expect(rows[1]).toHaveTextContent("Peluquería Sol");
    expect(rows[1]).toHaveTextContent(/17:00/);
    expect(rows[1]).toHaveTextContent(
      testI18n.t("common:bookingStatus.pending"),
    );
  });

  it("AC-KAN-151-01: links every row to the detail under its own business slug", async () => {
    vi.spyOn(
      fetchMyBookingsPageModule,
      "fetchMyBookingsPage",
    ).mockResolvedValue(
      buildPage([buildBooking({ businessId: SPAIN_BUSINESS.id })]),
    );
    renderMyBookings();

    const detailLink = await screen.findByRole("link", {
      name: testI18n.t("customer:myBookings.list.detailAction"),
    });

    expect(detailLink).toHaveAttribute(
      "href",
      "/peluqueria-sol/my-bookings/booking-1",
    );
  });

  it("AC-KAN-151-02: asks the server for the next page and shows the total count", async () => {
    const cursor = {
      ref: { path: "businesses/business-a/bookings/booking-20" },
    } as QueryDocumentSnapshot;
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValueOnce(
        buildPage([buildBooking()], { nextCursor: cursor, totalCount: 25 }),
      )
      .mockResolvedValue(
        buildPage([buildBooking({ id: "booking-21" })], { totalCount: 25 }),
      );
    renderMyBookings();
    const page = createMyBookingsPage();

    expect(await page.findPaginationSummary()).toHaveTextContent(
      "Página 1 · 25 resultados",
    );
    await page.clickNextPage();

    expect(await page.findPaginationSummary()).toHaveTextContent(
      "Página 2 · 25 resultados",
    );
    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageCursor: cursor }),
    );
  });

  it("a second click on next while the page loads does not repeat the cursor", async () => {
    const cursor = {
      ref: { path: "businesses/business-a/bookings/booking-20" },
    } as QueryDocumentSnapshot;
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValueOnce(
        buildPage([buildBooking()], { nextCursor: cursor, totalCount: 25 }),
      )
      .mockReturnValue(new Promise(() => undefined));
    renderMyBookings();
    const page = createMyBookingsPage();
    await page.findRows();

    await page.clickNextPage();
    await page.clickNextPage();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(await page.findPaginationSummary()).toHaveTextContent("Página 2");
    expect(
      screen.getByRole("button", {
        name: testI18n.t("common:pagination.nextAction"),
      }),
    ).toBeDisabled();
  });

  it("changing the tab does not keep the bookings of the other tab on screen", async () => {
    vi.spyOn(
      fetchMyBookingsPageModule,
      "fetchMyBookingsPage",
    ).mockImplementation(({ tab }) =>
      tab === MY_BOOKINGS_TAB.UPCOMING
        ? Promise.resolve(buildPage([buildBooking()]))
        : new Promise(() => undefined),
    );
    renderMyBookings();
    const page = createMyBookingsPage();
    await page.findRows();

    await page.clickHistoryTab();

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Corte de cabello")).not.toBeInTheDocument();
  });

  it("AC-KAN-151-03: shows the empty message when there are no upcoming bookings", async () => {
    vi.spyOn(
      fetchMyBookingsPageModule,
      "fetchMyBookingsPage",
    ).mockResolvedValue(buildPage([]));
    renderMyBookings();

    expect(
      await createMyBookingsPage().findEmptyMessage(
        testI18n.t("customer:myBookings.upcoming.empty"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-151-05: shows the network error with a retry that loads the list", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockRejectedValueOnce(new FirebaseError("unavailable", "offline"))
      .mockResolvedValue(buildPage([buildBooking()]));
    renderMyBookings();
    const page = createMyBookingsPage();

    expect(await page.findErrorAlert()).toHaveTextContent(
      testI18n.t("common:errors.network"),
    );
    await page.clickRetry();

    expect(await page.findRows()).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("AC-KAN-153-01: the history tab lists past and cancelled bookings", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockImplementation(({ tab }) =>
        Promise.resolve(
          tab === MY_BOOKINGS_TAB.HISTORY
            ? buildPage([
                buildBooking({
                  id: "booking-cancelled",
                  status: BOOKING_STATUS.CANCELLED,
                }),
                buildBooking({
                  id: "booking-done",
                  status: BOOKING_STATUS.COMPLETED,
                }),
              ])
            : buildPage([buildBooking()]),
        ),
      );
    renderMyBookings();
    const page = createMyBookingsPage();
    await page.findRows();

    await page.clickHistoryTab();
    const historyRows = await screen.findAllByRole("row");

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ tab: MY_BOOKINGS_TAB.HISTORY }),
    );
    expect(historyRows[1]).toHaveTextContent(
      testI18n.t("common:bookingStatus.cancelled"),
    );
    expect(historyRows[2]).toHaveTextContent(
      testI18n.t("common:bookingStatus.completed"),
    );
  });

  it("AC-KAN-153-03: shows the history empty message", async () => {
    vi.spyOn(
      fetchMyBookingsPageModule,
      "fetchMyBookingsPage",
    ).mockResolvedValue(buildPage([]));
    renderMyBookings(`${MY_BOOKINGS_PATH}?tab=${MY_BOOKINGS_TAB.HISTORY}`);

    expect(
      await createMyBookingsPage().findEmptyMessage(
        testI18n.t("customer:myBookings.history.empty"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-153-04: shows the network error in the history", async () => {
    vi.spyOn(
      fetchMyBookingsPageModule,
      "fetchMyBookingsPage",
    ).mockRejectedValue(new FirebaseError("unavailable", "offline"));
    renderMyBookings(`${MY_BOOKINGS_PATH}?tab=${MY_BOOKINGS_TAB.HISTORY}`);

    expect(await createMyBookingsPage().findErrorAlert()).toHaveTextContent(
      testI18n.t("common:errors.network"),
    );
  });

  it("does not request bookings without a signed-in customer", () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValue(buildPage([buildBooking()]));
    renderWithProviders(<MyBookingsPage />, {
      initialPath: MY_BOOKINGS_PATH,
      session: { ...SUBSCRIBER_SESSION, userId: "" },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
