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
    add: async (
      payloadData: Record<string, unknown>,
    ): Promise<{ id: string }> => {
      const id = `block-${Date.now()}`;
      documents.set(`${path}/${id}`, payloadData);
      return { id };
    },
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
    fromDate: (date: Date): Date => date,
    now: (): Date => new Date(),
  },
}));

describe("Vercel Serverless Functions: Schedule Admin Mutations (KAN-64, KAN-65, KAN-70)", () => {
  const businessId = "business-test-123";

  beforeEach((): void => {
    adminFake.documents.clear();
    adminFake.documents.set(`businesses/${businessId}`, {
      bookingConfirmationMode: "automatic",
      businessHours: {
        monday: [{ closesAt: "17:00", opensAt: "09:00" }],
      },
      name: "Negocio de Prueba",
      timeZone: "America/Costa_Rica",
    });
  });

  it("createScheduleBlock: adds schedule block to subcollection", async (): Promise<void> => {
    const result = await callServerFunction("createScheduleBlock", {
      businessId,
      collaboratorId: null,
      endsAt: "2026-11-10T14:00:00.000Z",
      isFullDay: false,
      reason: "Reunión de equipo",
      startsAt: "2026-11-10T12:00:00.000Z",
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.blockId).toBeDefined();

    const createdDoc = Array.from(adminFake.documents.entries()).find(([key]) =>
      key.startsWith(`businesses/${businessId}/scheduleBlocks/`),
    );
    expect(createdDoc).toBeDefined();
    expect(createdDoc?.[1]?.reason).toBe("Reunión de equipo");
  });

  it("deleteScheduleBlock: deletes schedule block from subcollection", async (): Promise<void> => {
    const blockId = "block-to-delete";
    adminFake.documents.set(
      `businesses/${businessId}/scheduleBlocks/${blockId}`,
      {
        businessId,
        reason: "Bloque temporal",
      },
    );

    const result = await callServerFunction("deleteScheduleBlock", {
      blockId,
      businessId,
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.success).toBe(true);
    expect(
      adminFake.documents.has(
        `businesses/${businessId}/scheduleBlocks/${blockId}`,
      ),
    ).toBe(false);
  });

  it("updateBusinessHours: updates businessHours on business document", async (): Promise<void> => {
    const newHours = {
      monday: [{ closesAt: "18:00", opensAt: "08:00" }],
      tuesday: [{ closesAt: "18:00", opensAt: "08:00" }],
    };

    const result = await callServerFunction("updateBusinessHours", {
      businessHours: newHours,
      businessId,
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.success).toBe(true);

    const updatedDoc = adminFake.documents.get(`businesses/${businessId}`);
    expect(updatedDoc?.businessHours).toEqual(newHours);
  });

  it("updateConfirmationMode: updates bookingConfirmationMode on business document", async (): Promise<void> => {
    const result = await callServerFunction("updateConfirmationMode", {
      businessId,
      mode: "manual",
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.mode).toBe("manual");

    const updatedDoc = adminFake.documents.get(`businesses/${businessId}`);
    expect(updatedDoc?.bookingConfirmationMode).toBe("manual");
  });
});
