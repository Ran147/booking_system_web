// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callServerFunction } from "./bookingTestHelpers";
import type { NullableUndefined } from "../../src/types/Nullable";

const adminFake = vi.hoisted(() => {
  const documents = new Map<string, Record<string, unknown>>();

  const createDocumentReference = (path: string): Record<string, unknown> => ({
    collection: (subcollectionName: string): Record<string, unknown> =>
      createCollectionReference(`${path}/${subcollectionName}`),
    delete: async (): Promise<void> => {
      documents.delete(path);
    },
    get: async (): Promise<{
      exists: boolean;
      id: string;
      ["data"]: () => NullableUndefined<Record<string, unknown>>;
    }> => ({
      ["data"]: (): NullableUndefined<Record<string, unknown>> =>
        documents.get(path),
      exists: documents.has(path),
      id: path.split("/").pop() ?? "",
    }),
    path,
    set: async (value: Record<string, unknown>): Promise<void> => {
      documents.set(path, value);
    },
    update: async (value: Record<string, unknown>): Promise<void> => {
      const current = documents.get(path) ?? {};
      documents.set(path, { ...current, ...value });
    },
  });

  const createCollectionReference = (
    path: string,
  ): Record<string, unknown> => ({
    doc: (documentId?: string): Record<string, unknown> => {
      const id = documentId ?? `auto-${Date.now()}`;
      return createDocumentReference(`${path}/${id}`);
    },
    where: (): Record<string, unknown> => ({
      get: async (): Promise<{
        docs: readonly {
          exists: boolean;
          id: string;
          ["data"]: () => Record<string, unknown>;
        }[];
        empty: boolean;
      }> => {
        const docs = [...documents.entries()]
          .filter(
            ([key]) =>
              key.startsWith(`${path}/`) &&
              key.split("/").length === path.split("/").length + 1,
          )
          .map(([key, documentValue]) => ({
            ["data"]: (): Record<string, unknown> => documentValue,
            exists: true,
            id: key.split("/").pop() ?? "",
          }));
        return { docs, empty: docs.length === 0 };
      },
    }),
  });

  return {
    documents,
    firestore: {
      collection: createCollectionReference,
      doc: (path: string): Record<string, unknown> =>
        createDocumentReference(path),
    },
  };
});

vi.mock("firebase-admin/app", () => ({
  cert: vi.fn(),
  getApps: (): object[] => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: (): object => ({}),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: (): object => adminFake.firestore,
  Timestamp: {
    now: (): Date => new Date(),
  },
}));

describe("Vercel Serverless Function: rescheduleBooking (KAN-71)", () => {
  const businessId = "business-123";
  const bookingId = "booking-456";

  beforeEach((): void => {
    adminFake.documents.clear();
    adminFake.documents.set(`businesses/${businessId}/bookings/${bookingId}`, {
      businessId,
      customerId: "customer-1",
      endsAt: new Date(Date.now() + 86400000 + 1800000),
      id: bookingId,
      rescheduleHistory: [],
      serviceSnapshot: {
        durationMinutes: 30,
        name: "Corte",
        priceInCents: 1500,
      },
      startsAt: new Date(Date.now() + 86400000),
      status: "confirmed",
    });
  });

  it("reschedules booking to a new future date and time successfully", async (): Promise<void> => {
    const newStartsAt = new Date(Date.now() + 172800000).toISOString();
    const result = await callServerFunction("rescheduleBooking", {
      bookingId,
      businessId,
      newStartsAt,
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.bookingId).toBe(bookingId);

    const updated = adminFake.documents.get(
      `businesses/${businessId}/bookings/${bookingId}`,
    );
    expect((updated?.rescheduleHistory as readonly unknown[])?.length).toBe(1);
  });

  it("rejects reschedule to a past date", async (): Promise<void> => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const result = await callServerFunction("rescheduleBooking", {
      bookingId,
      businessId,
      newStartsAt: pastDate,
    });

    expect(result.statusCode).toBe(400);
  });
});
