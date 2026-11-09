import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { fetchBusinessHours } from "../api/fetchBusinessHours";
import { BOOKING_CONFIRMATION_MODE } from "../constants";
import { BusinessHoursPage } from "../pages/BusinessHoursPage";

vi.mock("../api/fetchBusinessHours", () => ({
  fetchBusinessHours: vi.fn(),
}));

describe("BusinessHoursPage (KAN-64, KAN-70)", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
    vi.mocked(fetchBusinessHours).mockResolvedValue({
      businessHours: {
        friday: [{ closesAt: "17:00", opensAt: "09:00" }],
        monday: [{ closesAt: "17:00", opensAt: "09:00" }],
        saturday: [],
        sunday: [],
        thursday: [{ closesAt: "17:00", opensAt: "09:00" }],
        tuesday: [{ closesAt: "17:00", opensAt: "09:00" }],
        wednesday: [{ closesAt: "17:00", opensAt: "09:00" }],
      },
      confirmationMode: BOOKING_CONFIRMATION_MODE.AUTOMATIC,
      timeZone: "America/Costa_Rica",
    });
  });

  it("AC-KAN-64-01: renders business hours title and days of the week", async (): Promise<void> => {
    renderWithProviders(<BusinessHoursPage />, {
      initialPath: "/business/schedule/hours",
      session: SUBSCRIBER_SESSION,
    });

    await waitFor((): void => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Horario de atención" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/monday/i)).toBeInTheDocument();
    expect(screen.getByText(/sunday/i)).toBeInTheDocument();
  });

  it("AC-KAN-70-01: renders confirmation mode section with automatic and manual options", async (): Promise<void> => {
    renderWithProviders(<BusinessHoursPage />, {
      initialPath: "/business/schedule/hours",
      session: SUBSCRIBER_SESSION,
    });

    await waitFor((): void => {
      expect(
        screen.getByRole("heading", { name: "Modalidad de confirmación" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Confirmación automática/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmación manual/i)).toBeInTheDocument();
  });

  it("AC-KAN-64-02: shows error if invalid range is submitted", async (): Promise<void> => {
    const user = userEvent.setup();
    renderWithProviders(<BusinessHoursPage />, {
      initialPath: "/business/schedule/hours",
      session: SUBSCRIBER_SESSION,
    });

    const timeInputs = await screen.findAllByLabelText(/Desde|Hasta/i);
    expect(timeInputs.length).toBeGreaterThanOrEqual(2);

    // Set open time after close time
    await user.clear(timeInputs[0]!);
    await user.type(timeInputs[0]!, "18:00");
    await user.clear(timeInputs[1]!);
    await user.type(timeInputs[1]!, "09:00");

    const saveButton = screen.getByRole("button", { name: "Guardar horario" });
    await user.click(saveButton);

    await waitFor((): void => {
      expect(
        screen.getByText(
          "La hora de cierre debe ser posterior a la de apertura.",
        ),
      ).toBeInTheDocument();
    });
  });
});
