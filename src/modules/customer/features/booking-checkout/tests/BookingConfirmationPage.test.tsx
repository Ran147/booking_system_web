import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS, type BookingStatus } from "@/domain";
import { CUSTOMER_SESSION, renderRoutesWithProviders } from "@/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";
import { BookingConfirmationPage } from "../components/BookingConfirmationPage/BookingConfirmationPage";

// The booking detail of My bookings reads through these two; they are
// replaced so the screen gets a booking without Firestore.
const myBookingsFake = vi.hoisted(() => ({
  fetchBookingBusinessBySlug: vi.fn(),
  fetchMyBooking: vi.fn(),
}));

vi.mock(
  "@/modules/customer/features/my-bookings/api/fetchBookingBusinessBySlug",
  () => ({
    fetchBookingBusinessBySlug: myBookingsFake.fetchBookingBusinessBySlug,
  }),
);
vi.mock("@/modules/customer/features/my-bookings/api/fetchMyBooking", () => ({
  fetchMyBooking: myBookingsFake.fetchMyBooking,
}));

const BOOKING = {
  businessId: "business-1",
  cancellation: null,
  collaboratorName: null as Nullable<string>,
  durationMinutes: 45,
  endsAt: new Date("2026-11-20T15:45:00.000Z"),
  id: "booking-9",
  priceInCents: 20_000,
  serviceName: "Corte de cabello",
  startsAt: new Date("2026-11-20T15:00:00.000Z"),
  status: BOOKING_STATUS.CONFIRMED as BookingStatus,
};

const renderPage = (): ReturnType<typeof renderRoutesWithProviders> =>
  renderRoutesWithProviders(
    [
      {
        element: <BookingConfirmationPage />,
        path: "/:businessSlug/book/done/:bookingId",
      },
    ],
    {
      initialPath: "/barberia-centro/book/done/booking-9",
      session: CUSTOMER_SESSION,
    },
  );

const mockBooking = (overrides: Partial<typeof BOOKING> = {}): void => {
  myBookingsFake.fetchMyBooking.mockResolvedValue({
    ...BOOKING,
    ...overrides,
  });
};

describe("BookingConfirmationPage (KAN-149)", () => {
  beforeEach(() => {
    myBookingsFake.fetchMyBooking.mockReset();
    myBookingsFake.fetchBookingBusinessBySlug.mockResolvedValue({
      currency: "CRC",
      id: "business-1",
      name: "Barbería Centro",
      slug: "barberia-centro",
      timeZone: "America/Costa_Rica",
    });
  });

  it("AC-KAN-149-01 and AC-KAN-149-04: shows the confirmed booking read from the server", async () => {
    mockBooking();

    renderPage();

    const heading = await screen.findByRole("heading", {
      name: testI18n.t("customer:bookingCheckout.success.confirmedTitle"),
    });
    expect(heading).toHaveFocus();
    expect(screen.getByText("Barbería Centro")).toBeInTheDocument();
    expect(screen.getByText("Corte de cabello")).toBeInTheDocument();
    expect(myBookingsFake.fetchMyBooking).toHaveBeenCalledWith(
      "business-1",
      "booking-9",
    );
    expect(
      screen.getByRole("link", {
        name: testI18n.t("customer:bookingCheckout.success.myBookingsAction"),
      }),
    ).toHaveAttribute("href", "/barberia-centro/my-bookings");
  });

  it("AC-KAN-149-02: a pending booking says the business still has to confirm it", async () => {
    mockBooking({ status: BOOKING_STATUS.PENDING });

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("customer:bookingCheckout.success.pendingTitle"),
      }),
    ).toBeInTheDocument();
  });

  it("AC-KAN-149-05: shows who serves the booking when there is a collaborator", async () => {
    mockBooking({ collaboratorName: "Carlos Colaborador" });

    renderPage();

    expect(await screen.findByText("Carlos Colaborador")).toBeInTheDocument();
  });
});
