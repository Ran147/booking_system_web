import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS, CANCELLATION_ACTOR } from "@/domain";
import {
  CUSTOMER_SESSION,
  renderRoutesWithProviders,
} from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import * as fetchBookingBusinessBySlugModule from "../api/fetchBookingBusinessBySlug";
import * as fetchMyBookingModule from "../api/fetchMyBooking";
import { BookingDetailPage } from "../components/BookingDetailPage";
import type { BookingBusiness, MyBooking } from "../models";

const DETAIL_PATH = "/barberia-centro/my-bookings/booking-1";
const BUSINESS: BookingBusiness = {
  currency: "MXN",
  id: "business-a",
  name: "Barbería Centro",
  slug: "barberia-centro",
  timeZone: "America/Mexico_City",
};
const BOOKING: MyBooking = {
  businessId: BUSINESS.id,
  cancellation: null,
  collaboratorName: "Carlos Colaborador",
  durationMinutes: 45,
  endsAt: new Date("2026-11-02T16:45:00.000Z"),
  id: "booking-1",
  priceInCents: 25_000,
  serviceName: "Corte de cabello",
  startsAt: new Date("2026-11-02T16:00:00.000Z"),
  status: BOOKING_STATUS.CONFIRMED,
};

const renderDetail = (): void => {
  renderRoutesWithProviders(
    [
      {
        element: <BookingDetailPage />,
        path: "/:businessSlug/my-bookings/:bookingId",
      },
    ],
    { initialPath: DETAIL_PATH, session: CUSTOMER_SESSION },
  );
};

describe("BookingDetailPage (KAN-152)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(
      fetchBookingBusinessBySlugModule,
      "fetchBookingBusinessBySlug",
    ).mockResolvedValue(BUSINESS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-152-01: shows business, service, local times, duration, price and status", async () => {
    const fetchSpy = vi
      .spyOn(fetchMyBookingModule, "fetchMyBooking")
      .mockResolvedValue(BOOKING);
    renderDetail();

    expect(await screen.findByText("Corte de cabello")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(BUSINESS.id, "booking-1");
    expect(screen.getByText("Barbería Centro")).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/10:45/)).toBeInTheDocument();
    expect(screen.getByText("45 minutos")).toBeInTheDocument();
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("common:bookingStatus.confirmed")),
    ).toBeInTheDocument();
  });

  it("AC-KAN-152-02: a cancelled booking shows who cancelled it and the penalty, never the note", async () => {
    vi.spyOn(fetchMyBookingModule, "fetchMyBooking").mockResolvedValue({
      ...BOOKING,
      cancellation: {
        cancelledBy: CANCELLATION_ACTOR.BUSINESS,
        isPenalized: true,
      },
      status: BOOKING_STATUS.CANCELLED,
    });
    renderDetail();

    expect(
      await screen.findByText(
        new RegExp(
          testI18n.t(
            "customer:myBookings.detail.cancellation.cancelledBy.business",
          ),
        ),
      ),
    ).toHaveTextContent(
      testI18n.t("customer:myBookings.detail.cancellation.penalized"),
    );
  });

  it("AC-KAN-152-04: a missing booking shows not found and no data", async () => {
    vi.spyOn(fetchMyBookingModule, "fetchMyBooking").mockResolvedValue(null);
    renderDetail();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("common:errors.notFound"),
    );
    expect(screen.queryByText("Corte de cabello")).not.toBeInTheDocument();
  });

  it("AC-KAN-152-04: another customer's booking (permission denied) also shows not found", async () => {
    vi.spyOn(fetchMyBookingModule, "fetchMyBooking").mockRejectedValue(
      new FirebaseError("permission-denied", "denied"),
    );
    renderDetail();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("common:errors.notFound"),
    );
    expect(
      screen.queryByRole("button", {
        name: testI18n.t("customer:myBookings.retryAction"),
      }),
    ).not.toBeInTheDocument();
  });

  it("AC-KAN-152-04: an unknown business slug shows not found", async () => {
    vi.spyOn(
      fetchBookingBusinessBySlugModule,
      "fetchBookingBusinessBySlug",
    ).mockResolvedValue(null);
    const fetchSpy = vi.spyOn(fetchMyBookingModule, "fetchMyBooking");
    renderDetail();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("common:errors.notFound"),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-152-05: shows the current date and time of a rescheduled booking", async () => {
    vi.spyOn(fetchMyBookingModule, "fetchMyBooking").mockResolvedValue({
      ...BOOKING,
      endsAt: new Date("2026-11-04T18:45:00.000Z"),
      startsAt: new Date("2026-11-04T18:00:00.000Z"),
    });
    renderDetail();

    expect(await screen.findByText(/4 nov 2026, 12:00/)).toBeInTheDocument();
  });

  it("AC-KAN-152-07: shows the full name of the collaborator", async () => {
    vi.spyOn(fetchMyBookingModule, "fetchMyBooking").mockResolvedValue(BOOKING);
    renderDetail();

    expect(await screen.findByText("Carlos Colaborador")).toBeInTheDocument();
  });

  it("AC-KAN-152-07: without a collaborator it shows the business resource label", async () => {
    vi.spyOn(fetchMyBookingModule, "fetchMyBooking").mockResolvedValue({
      ...BOOKING,
      collaboratorName: null,
    });
    renderDetail();

    expect(
      await screen.findByText(
        testI18n.t("customer:myBookings.detail.businessResource"),
      ),
    ).toBeInTheDocument();
  });

  it("retrying after the business failed does not ask for a booking of no business", async () => {
    const user = userEvent.setup();
    vi.spyOn(fetchBookingBusinessBySlugModule, "fetchBookingBusinessBySlug")
      .mockRejectedValueOnce(new FirebaseError("unavailable", "offline"))
      .mockResolvedValue(BUSINESS);
    const fetchSpy = vi
      .spyOn(fetchMyBookingModule, "fetchMyBooking")
      .mockResolvedValue(BOOKING);
    renderDetail();
    await screen.findByRole("alert");

    await user.click(
      screen.getByRole("button", {
        name: testI18n.t("customer:myBookings.retryAction"),
      }),
    );

    expect(await screen.findByText("Corte de cabello")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(BUSINESS.id, "booking-1");
  });

  it("shows the price with the default currency when the business has none", async () => {
    vi.spyOn(
      fetchBookingBusinessBySlugModule,
      "fetchBookingBusinessBySlug",
    ).mockResolvedValue({ ...BUSINESS, currency: null });
    vi.spyOn(fetchMyBookingModule, "fetchMyBooking").mockResolvedValue(BOOKING);
    renderDetail();

    expect(await screen.findByText(/250,00/)).toBeInTheDocument();
  });

  it("shows a network error with a retry that loads the booking", async () => {
    const user = userEvent.setup();
    vi.spyOn(fetchMyBookingModule, "fetchMyBooking")
      .mockRejectedValueOnce(new FirebaseError("unavailable", "offline"))
      .mockResolvedValue(BOOKING);
    renderDetail();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("common:errors.network"),
    );
    await user.click(
      screen.getByRole("button", {
        name: testI18n.t("customer:myBookings.retryAction"),
      }),
    );

    expect(await screen.findByText("Corte de cabello")).toBeInTheDocument();
  });
});
