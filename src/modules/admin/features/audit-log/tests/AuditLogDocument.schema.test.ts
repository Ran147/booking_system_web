import { Timestamp, type DocumentSnapshot } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { AUDIT_LOG_ACTION_TYPE } from "@/domain";
import { mapAuditLogEntry } from "../api/AuditLogDocument.schema";

const DOCUMENT_DATA_KEY = "data";

const createMockSnapshot = (
  id: string,
  rawFields: Record<string, unknown>,
): DocumentSnapshot =>
  ({
    [DOCUMENT_DATA_KEY]: () => rawFields,
    id,
  }) as unknown as DocumentSnapshot;

describe("AuditLogDocument schema and mapper", () => {
  it("maps Firestore document with Timestamp to AuditLogEntry domain model", () => {
    const timestamp = Timestamp.fromDate(new Date("2026-11-07T12:00:00.000Z"));
    const snapshot = createMockSnapshot("entry-1", {
      actionType: AUDIT_LOG_ACTION_TYPE.BUSINESS_APPROVED,
      actorEmail: "admin@platform.com",
      actorUserId: "user-123",
      after: { status: "active" },
      before: { status: "pending" },
      createdAt: timestamp,
      reason: "Documentación verificada",
      targetId: "biz-1",
      targetName: "Barbería Premium",
      targetType: "business",
    });

    const mapped = mapAuditLogEntry(snapshot);

    expect(mapped.id).toBe("entry-1");
    expect(mapped.actionType).toBe(AUDIT_LOG_ACTION_TYPE.BUSINESS_APPROVED);
    expect(mapped.actorEmail).toBe("admin@platform.com");
    expect(mapped.actorUserId).toBe("user-123");
    expect(mapped.createdAt).toEqual(new Date("2026-11-07T12:00:00.000Z"));
    expect(mapped.reason).toBe("Documentación verificada");
    expect(mapped.targetId).toBe("biz-1");
    expect(mapped.targetName).toBe("Barbería Premium");
    expect(mapped.targetType).toBe("business");
    expect(mapped.before).toEqual({ status: "pending" });
    expect(mapped.after).toEqual({ status: "active" });
  });

  it("handles native Date and defaults null for missing optional values", () => {
    const date = new Date("2026-11-07T15:00:00.000Z");
    const snapshot = createMockSnapshot("entry-2", {
      actionType: AUDIT_LOG_ACTION_TYPE.PLATFORM_SETTINGS_UPDATED,
      createdAt: date,
      targetId: "settings-current",
      targetName: "Configuración global",
    });

    const mapped = mapAuditLogEntry(snapshot);

    expect(mapped.id).toBe("entry-2");
    expect(mapped.createdAt).toEqual(date);
    expect(mapped.before).toBeNull();
    expect(mapped.after).toBeNull();
    expect(mapped.reason).toBeNull();
    expect(mapped.actorEmail).toBe("");
    expect(mapped.actorUserId).toBe("");
  });
});
