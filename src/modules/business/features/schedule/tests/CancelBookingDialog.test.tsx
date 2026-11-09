import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS } from "@/domain";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { CancelBookingDialog } from "../components/bookings/CancelBookingDialog";

const mockCancelMutation = vi.fn();

vi.mock("../api/useCancelBookingMutation", () => ({
  useCancelBookingMutation: (): {
    isPending: boolean;
    mutateAsync: typeof mockCancelMutation;
  } => ({
    isPending: false,
    mutateAsync: mockCancelMutation,
  }),
}));

describe("CancelBookingDialog (KAN-72)", () => {
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

  it("AC-KAN-72-01: renders modal with mandatory note field and penalty checkbox", (): void => {
    renderWithProviders(
      <CancelBookingDialog
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
      screen.getByRole("heading", { name: "Cancelar reserva" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Nota aclaratoria obligatoria/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/¿Aplica penalización\?/i),
    ).toBeInTheDocument();
  });

  it("AC-KAN-72-02: requires non-empty note before submitting", async (): Promise<void> => {
    const user = userEvent.setup();
    renderWithProviders(
      <CancelBookingDialog
        booking={mockBooking}
        isOpen={true}
        onClose={vi.fn()}
      />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    const submitButton = screen.getByRole("button", {
      name: "Cancelar reserva",
    });
    await user.click(submitButton);

    expect(mockCancelMutation).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
