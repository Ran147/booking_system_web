import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS } from "@/domain";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { fetchBookingHistory } from "../api/fetchBookingHistory";
import { fetchBookingList } from "../api/fetchBookingList";
import { fetchBusinessHours } from "../api/fetchBusinessHours";
import { fetchScheduleBlocks } from "../api/fetchScheduleBlocks";
import { BOOKING_CONFIRMATION_MODE } from "../constants";
import { SchedulePage } from "../pages/SchedulePage";

vi.mock("../api/fetchBusinessHours", () => ({
  fetchBusinessHours: vi.fn(),
}));

vi.mock("../api/fetchScheduleBlocks", () => ({
  fetchScheduleBlocks: vi.fn(),
}));

vi.mock("../api/fetchBookingList", () => ({
  fetchBookingList: vi.fn(),
}));

vi.mock("../api/fetchBookingHistory", () => ({
  fetchBookingHistory: vi.fn(),
}));

vi.mock("../api/useActiveServicesQuery", () => ({
  useActiveServicesQuery: (): { ["data"]: readonly unknown[] } => ({
    ["data"]: [],
  }),
}));

describe("SchedulePage (KAN-67, KAN-68, KAN-75, KAN-76)", () => {
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
    vi.mocked(fetchScheduleBlocks).mockResolvedValue([]);
    vi.mocked(fetchBookingList).mockResolvedValue({
      bookings: [mockBooking],
      totalCount: 1,
    });
    vi.mocked(fetchBookingHistory).mockResolvedValue({
      bookings: [],
      totalCount: 0,
    });
  });

  it("AC-KAN-67-01: renders tabs and agenda view by default", async (): Promise<void> => {
    renderWithProviders(<SchedulePage />, {
      initialPath: "/business/schedule",
      session: SUBSCRIBER_SESSION,
    });

    await waitFor((): void => {
      expect(screen.getByRole("tab", { name: "Agenda" })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Próximas citas" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Historial" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Horario de atención" }),
      ).toBeInTheDocument();
    });
  });

  it("AC-KAN-75-01: switches to upcoming bookings tab and displays list", async (): Promise<void> => {
    const user = userEvent.setup();
    renderWithProviders(<SchedulePage />, {
      initialPath: "/business/schedule",
      session: SUBSCRIBER_SESSION,
    });

    await waitFor((): void => {
      expect(
        screen.getByRole("tab", { name: "Próximas citas" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "Próximas citas" }));

    await waitFor((): void => {
      expect(screen.getByText("Cliente Demo")).toBeInTheDocument();
      expect(screen.getByText("Corte Clásico")).toBeInTheDocument();
    });
  });

  it("AC-KAN-76-01: switches to history tab and displays filters", async (): Promise<void> => {
    const user = userEvent.setup();
    renderWithProviders(<SchedulePage />, {
      initialPath: "/business/schedule",
      session: SUBSCRIBER_SESSION,
    });

    await waitFor((): void => {
      expect(
        screen.getByRole("tab", { name: "Historial" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "Historial" }));

    await waitFor((): void => {
      expect(screen.getByText("Limpiar filtros")).toBeInTheDocument();
      expect(
        screen.getByText(
          "No se encontraron reservas con los filtros aplicados.",
        ),
      ).toBeInTheDocument();
    });
  });
});
