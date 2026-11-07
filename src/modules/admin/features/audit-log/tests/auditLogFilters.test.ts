import { describe, expect, it } from "vitest";
import { AUDIT_LOG_ACTION_TYPE } from "@/domain";
import {
  buildAuditLogSearchParams,
  hasActiveAuditLogFilters,
  isAuditLogDateRangeInvalid,
  readAuditLogFilters,
} from "../utils/auditLogFilters";

describe("auditLogFilters utils", () => {
  it("reads empty filters when no query parameters are present", () => {
    const searchParams = new URLSearchParams();
    const result = readAuditLogFilters(searchParams);

    expect(result.filters).toEqual({
      actionType: null,
      from: null,
      to: null,
    });
    expect(result.isUnknownActionTypeInUrl).toBe(false);
  });

  it("reads valid filters from search parameters (AC-KAN-195-02, AC-KAN-195-08)", () => {
    const searchParams = new URLSearchParams({
      actionType: AUDIT_LOG_ACTION_TYPE.PLAN_CREATED,
      from: "2026-11-01",
      to: "2026-11-07",
    });
    const result = readAuditLogFilters(searchParams);

    expect(result.filters).toEqual({
      actionType: AUDIT_LOG_ACTION_TYPE.PLAN_CREATED,
      from: "2026-11-01",
      to: "2026-11-07",
    });
    expect(result.isUnknownActionTypeInUrl).toBe(false);
  });

  it("flags unknown action type and ignores it (AC-KAN-195-10)", () => {
    const searchParams = new URLSearchParams({
      actionType: "non_existent_action_type",
    });
    const result = readAuditLogFilters(searchParams);

    expect(result.filters.actionType).toBeNull();
    expect(result.isUnknownActionTypeInUrl).toBe(true);
  });

  it("ignores malformed dates", () => {
    const searchParams = new URLSearchParams({
      from: "invalid-date",
      to: "9999-99-99",
    });
    const result = readAuditLogFilters(searchParams);

    expect(result.filters.from).toBeNull();
    expect(result.filters.to).toBeNull();
  });

  it("builds search params omitting null or empty filters", () => {
    const searchParams = buildAuditLogSearchParams({
      actionType: AUDIT_LOG_ACTION_TYPE.BUSINESS_APPROVED,
      from: "2026-11-01",
      to: null,
    });

    expect(searchParams.get("actionType")).toBe(
      AUDIT_LOG_ACTION_TYPE.BUSINESS_APPROVED,
    );
    expect(searchParams.get("from")).toBe("2026-11-01");
    expect(searchParams.has("to")).toBe(false);
  });

  it("validates invalid date range where from > to (AC-KAN-195-04)", () => {
    expect(isAuditLogDateRangeInvalid("2026-11-08", "2026-11-01")).toBe(true);
    expect(isAuditLogDateRangeInvalid("2026-11-01", "2026-11-08")).toBe(false);
    expect(isAuditLogDateRangeInvalid("2026-11-01", "2026-11-01")).toBe(false);
    expect(isAuditLogDateRangeInvalid(null, "2026-11-08")).toBe(false);
    expect(isAuditLogDateRangeInvalid("2026-11-08", null)).toBe(false);
  });

  it("determines active filters correctly", () => {
    expect(
      hasActiveAuditLogFilters({
        actionType: null,
        from: null,
        to: null,
      }),
    ).toBe(false);

    expect(
      hasActiveAuditLogFilters({
        actionType: AUDIT_LOG_ACTION_TYPE.PLAN_UPDATED,
        from: null,
        to: null,
      }),
    ).toBe(true);
  });
});
