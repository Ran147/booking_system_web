import type { DocumentSnapshot, Firestore } from "firebase/firestore";
import * as firestoreModule from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import { AUDIT_LOG_ACTION_TYPE } from "@/domain";
import { fetchAuditLogPage } from "../api/fetchAuditLogPage";

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

const createDocSnapshot = (id: string): DocumentSnapshot =>
  ({
    [DOCUMENT_DATA_KEY]: () => ({
      actionType: AUDIT_LOG_ACTION_TYPE.PLAN_CREATED,
      actorEmail: "superadmin@platform.com",
      actorUserId: "sa-1",
      after: null,
      before: null,
      createdAt: new Date("2026-11-07T10:00:00.000Z"),
      reason: null,
      targetId: "plan-basic",
      targetName: "Plan Básico",
      targetType: "plan",
    }),
    id,
  }) as unknown as DocumentSnapshot;

describe("fetchAuditLogPage", () => {
  it("queries audit entries with default page size and determines nextCursor correctly", async () => {
    const mockDocs = [
      createDocSnapshot("doc-1"),
      createDocSnapshot("doc-2"),
      createDocSnapshot("doc-3"),
    ];

    vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
      docs: mockDocs,
    } as never);

    vi.mocked(firestoreModule.getCountFromServer).mockResolvedValueOnce({
      [DOCUMENT_DATA_KEY]: () => ({ count: 10 }),
    } as never);

    const result = await fetchAuditLogPage(
      { pageSize: 2 },
      {} as unknown as Firestore,
    );

    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(10);
    expect(result.nextCursor).toBe(mockDocs[1]);
  });

  it("returns nextCursor null when result count does not exceed page size", async () => {
    const mockDocs = [createDocSnapshot("doc-1")];

    vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
      docs: mockDocs,
    } as never);

    vi.mocked(firestoreModule.getCountFromServer).mockResolvedValueOnce({
      [DOCUMENT_DATA_KEY]: () => ({ count: 1 }),
    } as never);

    const result = await fetchAuditLogPage(
      { pageSize: 2 },
      {} as unknown as Firestore,
    );

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.nextCursor).toBeNull();
  });

  it("returns empty result without querying Firestore when date range is invalid (AC-KAN-195-04)", async () => {
    const getDocsSpy = vi.mocked(firestoreModule.getDocs);
    getDocsSpy.mockClear();

    const result = await fetchAuditLogPage({
      filters: {
        actionType: null,
        from: "2026-11-10",
        to: "2026-11-01",
      },
    });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.nextCursor).toBeNull();
    expect(getDocsSpy).not.toHaveBeenCalled();
  });

  it("applies actionType and date range where constraints (AC-KAN-195-01, AC-KAN-195-08, AC-KAN-195-09)", async () => {
    const whereSpy = vi.mocked(firestoreModule.where);
    whereSpy.mockClear();

    vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
      docs: [createDocSnapshot("doc-1")],
    } as never);

    vi.mocked(firestoreModule.getCountFromServer).mockResolvedValueOnce({
      [DOCUMENT_DATA_KEY]: () => ({ count: 1 }),
    } as never);

    await fetchAuditLogPage({
      filters: {
        actionType: AUDIT_LOG_ACTION_TYPE.PLAN_PRICE_CHANGED,
        from: "2026-11-01",
        to: "2026-11-07",
      },
      timeZone: "UTC",
    });

    expect(whereSpy).toHaveBeenCalledWith(
      "actionType",
      "==",
      AUDIT_LOG_ACTION_TYPE.PLAN_PRICE_CHANGED,
    );
    expect(whereSpy).toHaveBeenCalledWith(
      "createdAt",
      ">=",
      new Date("2026-11-01T00:00:00.000Z"),
    );
    expect(whereSpy).toHaveBeenCalledWith(
      "createdAt",
      "<=",
      new Date("2026-11-07T23:59:59.999Z"),
    );
  });
});
