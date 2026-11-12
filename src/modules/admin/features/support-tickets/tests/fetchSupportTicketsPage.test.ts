import type { DocumentSnapshot, Firestore } from "firebase/firestore";
import * as firestoreModule from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import { SUPPORT_TICKET_STATUS } from "@/domain";
import { fetchSupportTicketsPage } from "../api/fetchSupportTicketsPage";

const DOCUMENT_DATA_KEY = "data";

vi.mock("firebase/firestore", async () => {
  const actual =
    await vi.importActual<typeof firestoreModule>("firebase/firestore");
  return {
    ...actual,
    collection: vi.fn(),
    getCountFromServer: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    startAfter: vi.fn(),
    where: vi.fn(),
  };
});

const createTicketSnapshot = (id: string): DocumentSnapshot =>
  ({
    [DOCUMENT_DATA_KEY]: () => ({
      businessId: "biz-1",
      businessName: "Salón Belleza",
      createdAt: new Date("2026-11-10T10:00:00.000Z"),
      createdByUserId: "user-1",
      message: "Duda sobre suscripción",
      ownerEmail: "salon@test.com",
      replies: [],
      resolvedAt: null,
      status: SUPPORT_TICKET_STATUS.OPEN,
      subject: "Consulta",
      updatedAt: new Date("2026-11-10T10:00:00.000Z"),
    }),
    id,
  }) as unknown as DocumentSnapshot;

describe("fetchSupportTicketsPage", () => {
  it("queries support tickets with default page size and determines nextCursor correctly", async () => {
    const mockDocs = [
      createTicketSnapshot("ticket-1"),
      createTicketSnapshot("ticket-2"),
      createTicketSnapshot("ticket-3"),
    ];

    vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
      docs: mockDocs,
    } as never);

    vi.mocked(firestoreModule.getCountFromServer).mockResolvedValueOnce({
      [DOCUMENT_DATA_KEY]: () => ({ count: 5 }),
    } as never);

    const result = await fetchSupportTicketsPage(
      { pageSize: 2 },
      {} as unknown as Firestore,
    );

    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(5);
    expect(result.nextCursor).toBe(mockDocs[1]);
  });

  it("applies status filter constraint when specified (AC-KAN-190-02)", async () => {
    const whereSpy = vi.mocked(firestoreModule.where);
    whereSpy.mockClear();

    vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
      docs: [createTicketSnapshot("ticket-1")],
    } as never);

    vi.mocked(firestoreModule.getCountFromServer).mockResolvedValueOnce({
      [DOCUMENT_DATA_KEY]: () => ({ count: 1 }),
    } as never);

    await fetchSupportTicketsPage({
      filters: { status: SUPPORT_TICKET_STATUS.IN_PROGRESS },
      pageSize: 10,
    });

    expect(whereSpy).toHaveBeenCalledWith(
      "status",
      "==",
      SUPPORT_TICKET_STATUS.IN_PROGRESS,
    );
  });
});
