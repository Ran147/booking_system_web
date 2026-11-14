import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS } from "@/domain";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { RescheduleBookingDialog } from "../components/bookings/RescheduleBookingDialog";

const mockRescheduleMutation = vi.fn();

vi.mock("../api/useRescheduleBookingMutation", () => ({
  useRescheduleBookingMutation: (): {
    isPending: boolean;
    mutateAsync: typeof mockRescheduleMutation;
  } => ({
    isPending: false,
    mutateAsync: mockRescheduleMutation,
  }),
}));

describe("RescheduleBookingDialog (KAN-71)", () => {
  const mockBooking = {
    businessId: "business-1",
    cancellation: null,
    collaboratorId: null,
    collaboratorName: null,
    customerId: "Cliente Demo",
    customerUserId: "cust-1",
    endsAt: new Date(Date.now() + 86400000 + 1800000),
    id: "booking-1",
    notes: null,
    rescheduleHistory: [],
    serviceId: "srv-1",
    serviceSnapshot: {
      durationMinutes: 30,
      name: "Corte Clásico",
      priceInCents: 2000,
    },
    startsAt: new Date(Date.now() + 86400000),
    status: BOOKING_STATUS.CONFIRMED,
  };

  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it("AC-KAN-71-01: renders reschedule modal with current service and date/time fields", (): void => {
    renderWithProviders(
      <RescheduleBookingDialog
        booking={mockBooking}
        isOpen={true}
        onClose={vi.fn()}
      />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    expect(
      screen.getByRole("heading", { name: "Reprogramar reserva" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Corte Clásico")).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hora/i)).toBeInTheDocument();
  });

  it("AC-KAN-71-02: submits reschedule with new date and time", async (): Promise<void> => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderWithProviders(
      <RescheduleBookingDialog
        booking={mockBooking}
        isOpen={true}
        onClose={handleClose}
      />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    const submitButton = screen.getByRole("button", {
      name: "Reprogramar",
    });
    await user.click(submitButton);

    expect(mockRescheduleMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: "booking-1",
        businessId: "business-test",
      }),
    );
  });
});
