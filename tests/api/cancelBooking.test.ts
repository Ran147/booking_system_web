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

describe("Vercel Serverless Function: cancelBooking (KAN-72)", () => {
  const businessId = "business-123";
  const bookingId = "booking-456";

  beforeEach((): void => {
    adminFake.documents.clear();
    adminFake.documents.set(`businesses/${businessId}/bookings/${bookingId}`, {
      businessId,
      customerId: "customer-1",
      id: bookingId,
      serviceSnapshot: {
        durationMinutes: 30,
        name: "Corte",
        priceInCents: 1500,
      },
      startsAt: new Date(Date.now() + 86400000),
      status: "confirmed",
    });
  });

  it("cancels booking successfully with note and penalty flag", async (): Promise<void> => {
    const result = await callServerFunction("cancelBooking", {
      bookingId,
      businessId,
      isPenalized: true,
      note: "Cliente solicitó cancelar por viaje",
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.status).toBe("cancelled");

    const saved = adminFake.documents.get(
      `businesses/${businessId}/bookings/${bookingId}`,
    );
    expect(saved?.status).toBe("cancelled");
    expect((saved?.cancellation as { isPenalized: boolean })?.isPenalized).toBe(
      true,
    );
  });

  it("rejects cancellation without note", async (): Promise<void> => {
    const result = await callServerFunction("cancelBooking", {
      bookingId,
      businessId,
      isPenalized: false,
      note: "",
    });

    expect(result.statusCode).toBe(400);
  });

  it("rejects cancellation if note exceeds 500 characters", async (): Promise<void> => {
    const result = await callServerFunction("cancelBooking", {
      bookingId,
      businessId,
      isPenalized: false,
      note: "a".repeat(501),
    });

    expect(result.statusCode).toBe(400);
  });

  it("rejects cancellation if already completed", async (): Promise<void> => {
    adminFake.documents.set(`businesses/${businessId}/bookings/${bookingId}`, {
      status: "completed",
    });

    const result = await callServerFunction("cancelBooking", {
      bookingId,
      businessId,
      isPenalized: false,
      note: "Intento de cancelar una completada",
    });

    expect(result.statusCode).toBe(412);
  });
});
