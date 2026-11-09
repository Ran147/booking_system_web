import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { BookingFormDialog } from "../components/bookings/BookingFormDialog";

const mockCreateMutation = vi.fn();

vi.mock("../api/useActiveServicesQuery", () => ({
  useActiveServicesQuery: (): {
    ["data"]: readonly {
      durationMinutes: number;
      id: string;
      name: string;
      priceInCents: number;
    }[];
  } => ({
    ["data"]: [
      {
        durationMinutes: 45,
        id: "srv-cut",
        name: "Corte de Barba",
        priceInCents: 1500,
      },
    ],
  }),
}));

vi.mock("../api/useCreateBookingMutation", () => ({
  useCreateBookingMutation: (): {
    isPending: boolean;
    mutateAsync: typeof mockCreateMutation;
  } => ({
    isPending: false,
    mutateAsync: mockCreateMutation,
  }),
}));

describe("BookingFormDialog (KAN-69)", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it("AC-KAN-69-01: renders create manual booking modal with required fields", async (): Promise<void> => {
    renderWithProviders(<BookingFormDialog isOpen={true} onClose={vi.fn()} />, {
      initialPath: "/business/schedule",
      session: SUBSCRIBER_SESSION,
    });

    expect(screen.getByText("Nueva reserva manual")).toBeInTheDocument();
    expect(screen.getByLabelText(/Servicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hora/i)).toBeInTheDocument();
  });

  it("AC-KAN-69-05: prevents submission when customer or service is empty", async (): Promise<void> => {
    const user = userEvent.setup();
    renderWithProviders(<BookingFormDialog isOpen={true} onClose={vi.fn()} />, {
      initialPath: "/business/schedule",
      session: SUBSCRIBER_SESSION,
    });

    const submitButton = screen.getByRole("button", {
      name: "Guardar reserva",
    });
    await user.click(submitButton);

    expect(mockCreateMutation).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
