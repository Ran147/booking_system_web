import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS, type Booking } from "@/domain";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { BookingDetailDrawer } from "../components";
import { createBookingDetailDrawerPage } from "./BookingDetailDrawer.page";

const mockUpdateStatusMutateAsync = vi.fn();

vi.mock("../api/useUpdateBookingStatusMutation", () => ({
  useUpdateBookingStatusMutation: (): {
    isPending: boolean;
    mutateAsync: typeof mockUpdateStatusMutateAsync;
  } => ({
    isPending: false,
    mutateAsync: mockUpdateStatusMutateAsync,
  }),
}));

const createBookingFixture = (overrides: Partial<Booking> = {}): Booking => ({
  businessId: "business-test",
  cancellation: null,
  collaboratorId: null,
  collaboratorName: null,
  customerId: "customer-1",
  customerUserId: "user-1",
  endsAt: new Date(Date.now() + 90_000_000),
  id: "booking-1",
  rescheduleHistory: [],
  serviceId: "service-1",
  serviceSnapshot: {
    durationMinutes: 45,
    name: "Corte Ejecutivo",
    priceInCents: 1200000,
  },
  startsAt: new Date(Date.now() + 86_400_000),
  status: BOOKING_STATUS.CONFIRMED,
  ...overrides,
});

describe("BookingDetailDrawer (KAN-70, KAN-73, KAN-74)", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockUpdateStatusMutateAsync.mockResolvedValue({
      bookingId: "booking-1",
      status: BOOKING_STATUS.CONFIRMED,
    });
  });

  it("AC-KAN-70-03: allows confirming a pending future booking", async (): Promise<void> => {
    const handleClose = vi.fn();
    const booking = createBookingFixture({ status: BOOKING_STATUS.PENDING });

    renderWithProviders(
      <BookingDetailDrawer
        booking={booking}
        hasStarted={false}
        isOpen={true}
        onCancelClick={vi.fn()}
        onClose={handleClose}
        onRescheduleClick={vi.fn()}
      />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    const detailPage = createBookingDetailDrawerPage();
    expect(detailPage.getHeading("Corte Ejecutivo")).toBeInTheDocument();
    expect(detailPage.queryConfirmAction()).toBeInTheDocument();

    await detailPage.clickConfirmAction();

    expect(mockUpdateStatusMutateAsync).toHaveBeenCalledWith({
      bookingId: "booking-1",
      businessId: SUBSCRIBER_SESSION.businessId,
      targetStatus: BOOKING_STATUS.CONFIRMED,
    });
    expect(handleClose).toHaveBeenCalled();
  });

  it("AC-KAN-73-02: hides complete and no-show actions when confirmed booking has not started", (): void => {
    const booking = createBookingFixture({ status: BOOKING_STATUS.CONFIRMED });

    renderWithProviders(
      <BookingDetailDrawer
        booking={booking}
        hasStarted={false}
        isOpen={true}
        onCancelClick={vi.fn()}
        onClose={vi.fn()}
        onRescheduleClick={vi.fn()}
      />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    const detailPage = createBookingDetailDrawerPage();
    expect(detailPage.queryCompleteAction()).not.toBeInTheDocument();
    expect(detailPage.queryNoShowAction()).not.toBeInTheDocument();
    expect(detailPage.queryRescheduleAction()).toBeInTheDocument();
    expect(detailPage.queryCancelAction()).toBeInTheDocument();
  });

  it("AC-KAN-73-01: marks a started confirmed booking as completed", async (): Promise<void> => {
    const booking = createBookingFixture({ status: BOOKING_STATUS.CONFIRMED });

    renderWithProviders(
      <BookingDetailDrawer
        booking={booking}
        hasStarted={true}
        isOpen={true}
        onCancelClick={vi.fn()}
        onClose={vi.fn()}
        onRescheduleClick={vi.fn()}
      />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    const detailPage = createBookingDetailDrawerPage();
    await detailPage.clickCompleteAction();

    expect(mockUpdateStatusMutateAsync).toHaveBeenCalledWith({
      bookingId: "booking-1",
      businessId: SUBSCRIBER_SESSION.businessId,
      targetStatus: BOOKING_STATUS.COMPLETED,
    });
  });

  it("AC-KAN-74-01: marks a started confirmed booking as no-show", async (): Promise<void> => {
    const booking = createBookingFixture({ status: BOOKING_STATUS.CONFIRMED });

    renderWithProviders(
      <BookingDetailDrawer
        booking={booking}
        hasStarted={true}
        isOpen={true}
        onCancelClick={vi.fn()}
        onClose={vi.fn()}
        onRescheduleClick={vi.fn()}
      />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    const detailPage = createBookingDetailDrawerPage();
    await detailPage.clickNoShowAction();

    expect(mockUpdateStatusMutateAsync).toHaveBeenCalledWith({
      bookingId: "booking-1",
      businessId: SUBSCRIBER_SESSION.businessId,
      targetStatus: BOOKING_STATUS.NO_SHOW,
    });
  });

  it("AC-KAN-73-06: hides status, reschedule and cancel actions for terminal bookings", (): void => {
    const booking = createBookingFixture({ status: BOOKING_STATUS.COMPLETED });

    renderWithProviders(
      <BookingDetailDrawer
        booking={booking}
        hasStarted={true}
        isOpen={true}
        onCancelClick={vi.fn()}
        onClose={vi.fn()}
        onRescheduleClick={vi.fn()}
      />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    const detailPage = createBookingDetailDrawerPage();
    expect(detailPage.queryConfirmAction()).not.toBeInTheDocument();
    expect(detailPage.queryCompleteAction()).not.toBeInTheDocument();
    expect(detailPage.queryNoShowAction()).not.toBeInTheDocument();
    expect(detailPage.queryRescheduleAction()).not.toBeInTheDocument();
    expect(detailPage.queryCancelAction()).not.toBeInTheDocument();
  });
});
