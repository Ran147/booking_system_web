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
    id: path.split("/").pop() ?? "",
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
      const id =
        documentId ??
        `auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return createDocumentReference(`${path}/${id}`);
    },
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
      limit: (): Record<string, unknown> => ({
        get: async (): Promise<{ empty: boolean }> => ({ empty: true }),
      }),
      where: (): Record<string, unknown> => ({
        get: async (): Promise<{ empty: boolean }> => ({ empty: true }),
      }),
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

describe("Vercel Serverless Function: createBooking (KAN-69)", () => {
  const businessId = "business-123";
  const serviceId = "service-456";

  beforeEach((): void => {
    adminFake.documents.clear();

    adminFake.documents.set(`businesses/${businessId}`, {
      bookingConfirmationMode: "automatic",
      status: "active",
    });

    adminFake.documents.set(`businesses/${businessId}/services/${serviceId}`, {
      durationMinutes: 30,
      name: "Corte de Cabello",
      priceInCents: 2000,
      status: "active",
    });
  });

  it("creates a confirmed booking when confirmation mode is automatic", async (): Promise<void> => {
    const result = await callServerFunction("createBooking", {
      businessId,
      customerId: "Cliente Juan",
      serviceId,
      startsAt: "2026-11-10T10:00:00.000Z",
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.status).toBe("confirmed");
    expect(typeof result.body.bookingId).toBe("string");
  });

  it("creates a pending booking when confirmation mode is manual", async (): Promise<void> => {
    adminFake.documents.set(`businesses/${businessId}`, {
      bookingConfirmationMode: "manual",
      status: "active",
    });

    const result = await callServerFunction("createBooking", {
      businessId,
      customerId: "Cliente Pedro",
      serviceId,
      startsAt: "2026-11-10T11:00:00.000Z",
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.status).toBe("pending");
  });

  it("rejects booking if service is inactive", async (): Promise<void> => {
    adminFake.documents.set(`businesses/${businessId}/services/${serviceId}`, {
      durationMinutes: 30,
      name: "Corte Inactivo",
      priceInCents: 2000,
      status: "inactive",
    });

    const result = await callServerFunction("createBooking", {
      businessId,
      customerId: "Cliente",
      serviceId,
      startsAt: "2026-11-10T10:00:00.000Z",
    });

    expect(result.statusCode).toBe(412);
  });

  it("rejects booking if customer is blocked", async (): Promise<void> => {
    adminFake.documents.set(`businesses/${businessId}/customers/cust-blocked`, {
      status: "blocked",
    });

    const result = await callServerFunction("createBooking", {
      businessId,
      customerId: "cust-blocked",
      serviceId,
      startsAt: "2026-11-10T10:00:00.000Z",
    });

    expect(result.statusCode).toBe(412);
    expect(result.body.details).toEqual({ reason: "customer_blocked" });
  });
});
