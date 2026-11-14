import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { ScheduleBlockDialog } from "../components/blocks/ScheduleBlockDialog";

describe("ScheduleBlockDialog (KAN-65)", () => {
  const createMockViewModel = (
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> => ({
    closeDialog: vi.fn(),
    deleteExistingBlock: vi.fn(),
    errorMessage: null,
    formData: {
      collaboratorId: null,
      date: "2026-11-10",
      endTime: "14:00",
      forceOverlap: false,
      isFullDay: false,
      reason: "Almuerzo de equipo",
      startDate: "2026-11-10",
      startTime: "12:00",
    },
    isCreating: false,
    isDeleting: false,
    isDialogOpen: true,
    openEditDialog: vi.fn(),
    openNewDialog: vi.fn(),
    selectedBlock: null,
    submitBlock: vi.fn(),
    updateFormField: vi.fn(),
    ...overrides,
  });

  it("AC-KAN-65-01: renders modal with reason, all-day toggle, and date fields", (): void => {
    const viewModel = createMockViewModel();

    renderWithProviders(
      <ScheduleBlockDialog viewModel={viewModel as never} />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    expect(
      screen.getByRole("heading", { name: "Nuevo bloqueo" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Día completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motivo/i)).toBeInTheDocument();
  });

  it("AC-KAN-65-02: triggers submitBlock when form is submitted", async (): Promise<void> => {
    const user = userEvent.setup();
    const submitBlock = vi.fn();
    const viewModel = createMockViewModel({ submitBlock });

    renderWithProviders(
      <ScheduleBlockDialog viewModel={viewModel as never} />,
      {
        initialPath: "/business/schedule",
        session: SUBSCRIBER_SESSION,
      },
    );

    const submitButton = screen.getByRole("button", {
      name: "Guardar bloqueo",
    });
    await user.click(submitButton);

    expect(submitBlock).toHaveBeenCalled();
  });
});
