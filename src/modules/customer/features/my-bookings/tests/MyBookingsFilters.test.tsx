import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS } from "@/domain";
import { CUSTOMER_SESSION, renderWithProviders } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createMyBookingsPage } from "./MyBookingsPage.page";
import * as fetchBookingBusinessModule from "../api/fetchBookingBusiness";
import * as fetchCustomerBusinessIdsModule from "../api/fetchCustomerBusinessIds";
import * as fetchMyBookingsPageModule from "../api/fetchMyBookingsPage";
import { MyBookingsPage } from "../components/MyBookingsPage";
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
const BOOKING: MyBooking = {
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
};

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

const renderMyBookings = (search = ""): void => {
  renderWithProviders(<MyBookingsPage />, {
    initialPath: `${MY_BOOKINGS_PATH}${search}`,
    session: CUSTOMER_SESSION,
  });
};

const statusSelect = (): HTMLElement =>
  screen.getByLabelText(testI18n.t("customer:myBookings.filters.status"));
const businessSelect = (): HTMLElement =>
  screen.getByLabelText(testI18n.t("customer:myBookings.filters.business"));

describe("MyBookingsPage filters (KAN-154)", () => {
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

  it("AC-KAN-154-01: each list offers only the statuses that can appear in it", async () => {
    vi.spyOn(
      fetchMyBookingsPageModule,
      "fetchMyBookingsPage",
    ).mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings();
    const page = createMyBookingsPage();
    await page.findRows();
    const cancelled = testI18n.t("common:bookingStatus.cancelled");

    expect(
      screen.getByRole("option", {
        name: testI18n.t("common:bookingStatus.pending"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: cancelled }),
    ).not.toBeInTheDocument();

    await page.clickHistoryTab();

    expect(
      await screen.findByRole("option", { name: cancelled }),
    ).toBeInTheDocument();
  });

  it("AC-KAN-154-01: requests only the chosen status", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings();
    await createMyBookingsPage().findRows();

    await userEvent.selectOptions(statusSelect(), BOOKING_STATUS.PENDING);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ status: BOOKING_STATUS.PENDING }),
        }),
      );
    });
  });

  it("AC-KAN-154-02: requests the date range of the history", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings("?tab=history");
    await createMyBookingsPage().findRows();

    fireEvent.change(
      screen.getByLabelText(testI18n.t("customer:myBookings.filters.from")),
      { target: { value: "2026-10-01" } },
    );
    fireEvent.change(
      screen.getByLabelText(testI18n.t("customer:myBookings.filters.to")),
      { target: { value: "2026-10-31" } },
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            from: "2026-10-01",
            to: "2026-10-31",
          }),
        }),
      );
    });
  });

  it("AC-KAN-154-02: the upcoming list has no date range", async () => {
    vi.spyOn(
      fetchMyBookingsPageModule,
      "fetchMyBookingsPage",
    ).mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings();
    await createMyBookingsPage().findRows();

    expect(
      screen.queryByLabelText(testI18n.t("customer:myBookings.filters.from")),
    ).not.toBeInTheDocument();
  });

  it("AC-KAN-154-03: lists the businesses of the customer and filters by one, reading dates in its time zone", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings();
    await createMyBookingsPage().findRows();

    expect(
      await screen.findByRole("option", { name: SPAIN_BUSINESS.name }),
    ).toBeInTheDocument();
    await userEvent.selectOptions(businessSelect(), SPAIN_BUSINESS.id);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ businessId: SPAIN_BUSINESS.id }),
          timeZone: SPAIN_BUSINESS.timeZone,
        }),
      );
    });
  });

  it("AC-KAN-154-04: applies the filters of the URL and shows them in the controls", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings("?tab=history&status=cancelled&from=2026-10-01");
    await createMyBookingsPage().findRows();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          from: "2026-10-01",
          status: BOOKING_STATUS.CANCELLED,
        }),
        tab: "history",
      }),
    );
    expect(statusSelect()).toHaveValue(BOOKING_STATUS.CANCELLED);
    expect(
      screen.getByLabelText(testI18n.t("customer:myBookings.filters.from")),
    ).toHaveValue("2026-10-01");
  });

  it("AC-KAN-154-04: changing a filter returns to the first page", async () => {
    const cursor = {
      ref: { path: "businesses/business-a/bookings/booking-20" },
    } as QueryDocumentSnapshot;
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockImplementation(({ pageCursor }) =>
        Promise.resolve(
          pageCursor
            ? buildPage([BOOKING], { totalCount: 25 })
            : buildPage([BOOKING], { nextCursor: cursor, totalCount: 25 }),
        ),
      );
    renderMyBookings();
    const page = createMyBookingsPage();
    await page.findRows();
    await page.clickNextPage();
    expect(await page.findPaginationSummary()).toHaveTextContent("Página 2");

    await userEvent.selectOptions(statusSelect(), BOOKING_STATUS.PENDING);

    expect(await screen.findByText(/Página 1/)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageCursor: null }),
    );
  });

  it("AC-KAN-154-04: clearing the filters shows the full list again", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings("?status=pending");
    await createMyBookingsPage().findRows();

    await userEvent.click(
      screen.getByRole("button", {
        name: testI18n.t("customer:myBookings.filters.clearAction"),
      }),
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: {
            businessId: null,
            from: null,
            status: null,
            to: null,
          },
        }),
      );
    });
    expect(statusSelect()).toHaveValue("");
  });

  it("AC-KAN-154-05: filters that match nothing offer to clear them", async () => {
    vi.spyOn(
      fetchMyBookingsPageModule,
      "fetchMyBookingsPage",
    ).mockResolvedValue(buildPage([]));
    renderMyBookings("?status=pending");

    expect(
      await screen.findByText(
        testI18n.t("customer:myBookings.filters.noResultsEmpty"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: testI18n.t("customer:myBookings.filters.clearAction"),
      }),
    ).not.toHaveLength(0);
  });

  it("AC-KAN-154-06: an end date before the start shows the error and requests nothing", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings("?tab=history&from=2026-10-10&to=2026-10-01");

    expect(
      await screen.findByText(
        testI18n.t("customer:myBookings.filters.invalidRangeError"),
      ),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-154-07: a network error keeps the filters for a retry", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingsPageModule, "fetchMyBookingsPage")
      .mockRejectedValueOnce(new FirebaseError("unavailable", "offline"))
      .mockResolvedValue(buildPage([BOOKING]));
    renderMyBookings("?status=pending");
    const page = createMyBookingsPage();

    expect(await page.findErrorAlert()).toHaveTextContent(
      testI18n.t("common:errors.network"),
    );
    expect(statusSelect()).toHaveValue(BOOKING_STATUS.PENDING);
    await page.clickRetry();

    expect(await page.findRows()).toHaveLength(1);
    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ status: BOOKING_STATUS.PENDING }),
      }),
    );
  });
});
