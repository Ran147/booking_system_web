import type { DocumentSnapshot } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { SUPPORT_TICKET_STATUS } from "@/domain";
import { mapSupportTicket } from "../api/SupportTicketDocument.schema";

const DOCUMENT_DATA_KEY = "data";

describe("SupportTicketDocument.schema", () => {
  it("maps a valid Firestore support ticket document snapshot", () => {
    const rawData = {
      businessId: "biz-123",
      businessName: "Barbería Estilo",
      createdAt: new Date("2026-11-10T10:00:00.000Z"),
      createdByUserId: "user-owner-1",
      message: "No puedo configurar mi horario de atención.",
      ownerEmail: "owner@barberia.com",
      replies: [
        {
          body: "Hola, estamos revisando tu incidencia.",
          emailFailed: false,
          id: "reply-1",
          sentAt: new Date("2026-11-10T11:00:00.000Z"),
          sentByEmail: "support@platform.com",
          sentByUserId: "admin-sa-1",
        },
      ],
      resolvedAt: null,
      status: SUPPORT_TICKET_STATUS.IN_PROGRESS,
      subject: "Problema con horario",
      updatedAt: new Date("2026-11-10T11:00:00.000Z"),
    };

    const mockSnapshot = {
      [DOCUMENT_DATA_KEY]: (): unknown => rawData,
      id: "ticket-123",
    } as unknown as DocumentSnapshot;

    const ticket = mapSupportTicket(mockSnapshot);

    expect(ticket.id).toBe("ticket-123");
    expect(ticket.businessId).toBe("biz-123");
    expect(ticket.businessName).toBe("Barbería Estilo");
    expect(ticket.subject).toBe("Problema con horario");
    expect(ticket.message).toBe("No puedo configurar mi horario de atención.");
    expect(ticket.ownerEmail).toBe("owner@barberia.com");
    expect(ticket.status).toBe(SUPPORT_TICKET_STATUS.IN_PROGRESS);
    expect(ticket.replies).toHaveLength(1);
    expect(ticket.replies[0]?.body).toBe(
      "Hola, estamos revisando tu incidencia.",
    );
  });

  it("handles missing ownerEmail and empty replies defaulting gracefully", () => {
    const rawData = {
      businessId: "biz-456",
      createdAt: {
        toDate: (): Date => new Date("2026-11-10T09:00:00.000Z"),
      },
      createdByUserId: "user-owner-2",
      message: "Consulta sobre facturación.",
      status: SUPPORT_TICKET_STATUS.OPEN,
      subject: "Duda factura",
      updatedAt: {
        toDate: (): Date => new Date("2026-11-10T09:00:00.000Z"),
      },
    };

    const mockSnapshot = {
      [DOCUMENT_DATA_KEY]: (): unknown => rawData,
      id: "ticket-456",
    } as unknown as DocumentSnapshot;

    const ticket = mapSupportTicket(mockSnapshot);

    expect(ticket.id).toBe("ticket-456");
    expect(ticket.ownerEmail).toBeNull();
    expect(ticket.replies).toEqual([]);
    expect(ticket.resolvedAt).toBeNull();
    expect(ticket.status).toBe(SUPPORT_TICKET_STATUS.OPEN);
  });
});
