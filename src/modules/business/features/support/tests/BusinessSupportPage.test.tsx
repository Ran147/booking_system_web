import { waitFor } from "@testing-library/react";
import type { Mock } from "vitest";
import { toast } from "@/components/common";
import { FUNCTION_NAME } from "@/constants";
import { type SupportTicket, SUPPORT_TICKET_STATUS } from "@/domain";
import { callFunction } from "@/services/firebase/callFunction";
import {
  renderWithProviders,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/test-utils";
import { createBusinessSupportPage } from "./BusinessSupportPage.page";
import { SupportPage } from "../SupportPage";
import { fetchSupportTickets } from "../api/fetchSupportTickets";

vi.mock("@/services/firebase/callFunction", () => ({
  callFunction: vi.fn(),
}));

vi.mock("../api/fetchSupportTickets", () => ({
  fetchSupportTickets: vi.fn(),
}));

const MOCK_TICKET_OPEN: SupportTicket = {
  businessId: "business-test",
  businessName: "Barbería Elite",
  createdAt: new Date("2026-11-15T12:00:00.000Z"),
  createdByUserId: "subscriber-test",
  id: "ticket-1",
  message: "Tengo un problema con la sincronización del calendario",
  ownerEmail: "owner@test.com",
  replies: [],
  resolvedAt: null,
  status: SUPPORT_TICKET_STATUS.OPEN,
  subject: "Error de sincronización",
  updatedAt: new Date("2026-11-15T12:00:00.000Z"),
};

const MOCK_TICKET_RESOLVED: SupportTicket = {
  businessId: "business-test",
  businessName: "Barbería Elite",
  createdAt: new Date("2026-11-14T08:00:00.000Z"),
  createdByUserId: "subscriber-test",
  id: "ticket-2",
  message: "Cómo puedo cambiar mi plan de suscripción?",
  ownerEmail: "owner@test.com",
  replies: [
    {
      body: "Hola, puedes cambiar tu plan desde Configuración > Suscripción.",
      emailFailed: false,
      id: "reply-1",
      sentAt: new Date("2026-11-14T09:30:00.000Z"),
      sentByEmail: "support@antigravity.dev",
      sentByUserId: "admin-1",
    },
  ],
  resolvedAt: new Date("2026-11-14T10:00:00.000Z"),
  status: SUPPORT_TICKET_STATUS.RESOLVED,
  subject: "Consulta sobre plan",
  updatedAt: new Date("2026-11-14T10:00:00.000Z"),
};

describe("SupportPage (KAN-202)", () => {
  const page = createBusinessSupportPage();
  const mockedFetchSupportTickets = fetchSupportTickets as unknown as Mock;
  const mockedCallFunction = callFunction as unknown as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AC-KAN-202-08: muestra el estado vacío cuando no hay tickets creados", async () => {
    mockedFetchSupportTickets.mockResolvedValue([]);

    renderWithProviders(<SupportPage />, {
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() => {
      expect(page.getEmptyStateHeading()).toBeInTheDocument();
    });
  });

  it("AC-KAN-202-02: muestra el listado de tickets con sus respectivos badges de estado", async () => {
    mockedFetchSupportTickets.mockResolvedValue([
      MOCK_TICKET_OPEN,
      MOCK_TICKET_RESOLVED,
    ]);

    renderWithProviders(<SupportPage />, {
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() => {
      expect(
        page.getTicketStatusBadge(
          "Error de sincronización",
          testI18n.t("business:support.status.open"),
        ),
      ).toBeInTheDocument();
      expect(
        page.getTicketStatusBadge(
          "Consulta sobre plan",
          testI18n.t("business:support.status.resolved"),
        ),
      ).toBeInTheDocument();
    });
  });

  it("AC-KAN-202-01: permite crear un ticket exitosamente llamando a la Cloud Function", async () => {
    mockedFetchSupportTickets.mockResolvedValue([]);
    mockedCallFunction.mockResolvedValue({
      ticketId: "new-ticket-id",
    });
    const toastSuccessSpy = vi.spyOn(toast, "success");

    renderWithProviders(<SupportPage />, {
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() => {
      expect(page.getEmptyStateHeading()).toBeInTheDocument();
    });

    await page.clickCreateFirstTicketButton();

    await page.fillTicketForm(
      "Duda sobre configuración de citas",
      "Necesito ayuda configurando los horarios de los colaboradores.",
    );

    await page.clickSubmitTicketButton();

    await waitFor(() => {
      expect(mockedCallFunction).toHaveBeenCalledWith(
        FUNCTION_NAME.CREATE_SUPPORT_TICKET,
        {
          businessId: "business-test",
          message:
            "Necesito ayuda configurando los horarios de los colaboradores.",
          subject: "Duda sobre configuración de citas",
        },
      );
      expect(toastSuccessSpy).toHaveBeenCalledWith(
        testI18n.t("business:support.create.success"),
      );
    });
  });

  it("AC-KAN-202-03: abre el drawer de detalle con el mensaje original y las respuestas del equipo", async () => {
    mockedFetchSupportTickets.mockResolvedValue([MOCK_TICKET_RESOLVED]);

    renderWithProviders(<SupportPage />, {
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() => {
      expect(
        page.getTicketStatusBadge(
          "Consulta sobre plan",
          testI18n.t("business:support.status.resolved"),
        ),
      ).toBeInTheDocument();
    });

    await page.clickTicketRow("Consulta sobre plan");

    expect(
      page.getDetailDrawerHeading("Consulta sobre plan"),
    ).toBeInTheDocument();
    expect(
      page.getDetailDrawerMessages("Cómo puedo cambiar mi plan de suscripción?")
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      page.getReplyElement(
        "Hola, puedes cambiar tu plan desde Configuración > Suscripción.",
      ),
    ).toBeInTheDocument();

    await page.clickCloseDrawerButton();
  });

  it("AC-KAN-202-04: deshabilita el botón de envío si los campos obligatorios están vacíos", async () => {
    mockedFetchSupportTickets.mockResolvedValue([]);

    renderWithProviders(<SupportPage />, {
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() => {
      expect(page.getEmptyStateHeading()).toBeInTheDocument();
    });

    await page.clickNewTicketButton();
    expect(page.getSubmitTicketButton()).toBeDisabled();
    expect(mockedCallFunction).not.toHaveBeenCalled();
  });

  it("AC-KAN-202-10: el botón de envío se deshabilita mientras la creación está pendiente", async () => {
    mockedFetchSupportTickets.mockResolvedValue([]);
    let resolveMutation: (value: { ticketId: string }) => void = () =>
      undefined;
    mockedCallFunction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMutation = resolve;
        }),
    );

    renderWithProviders(<SupportPage />, {
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() => {
      expect(page.getEmptyStateHeading()).toBeInTheDocument();
    });

    await page.clickCreateFirstTicketButton();
    await page.fillTicketForm("Consulta urgente", "Detalle de la consulta");

    expect(page.getSubmitTicketButton()).toBeEnabled();
    await page.clickSubmitTicketButton();

    expect(page.getPendingSubmitTicketButton()).toBeDisabled();

    resolveMutation({ ticketId: "resolved-ticket-id" });
  });
});
