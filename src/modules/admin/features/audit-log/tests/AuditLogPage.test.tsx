import { screen, waitFor, within } from "@testing-library/react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { RouteObject } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIT_LOG_ACTION_TYPE, type AuditLogEntry } from "@/domain";
import { adminRoutes } from "@/modules/admin/admin.routes";
import { ROUTE_PATH } from "@/shared/constants";
import {
  CUSTOMER_SESSION,
  renderRoutesWithProviders,
  renderWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
} from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { AuditLogPage } from "../AuditLogPage";
import { createAuditLogPage } from "./AuditLogPage.page";
import * as fetchAuditLogPageModule from "../api/fetchAuditLogPage";

const AUDIT_LOG_PATH = `${ROUTE_PATH.ADMIN.ROOT}/${ROUTE_PATH.ADMIN.AUDIT_LOG}`;

const buildAuditLogEntry = (
  overrides: Partial<AuditLogEntry> = {},
): AuditLogEntry => ({
  actionType: AUDIT_LOG_ACTION_TYPE.BUSINESS_APPROVED,
  actorEmail: "admin@platform.com",
  actorUserId: "admin-user-1",
  after: { status: "active" },
  before: { status: "pending" },
  createdAt: new Date("2026-11-07T14:30:00.000Z"),
  id: "audit-entry-1",
  reason: null,
  targetId: "business-1",
  targetName: "Barbería Estilo",
  targetType: "business",
  ...overrides,
});

const buildPage = (
  items: AuditLogEntry[],
  overrides: { nextCursor?: QueryDocumentSnapshot; totalCount?: number } = {},
): Awaited<ReturnType<typeof fetchAuditLogPageModule.fetchAuditLogPage>> => ({
  items,
  nextCursor: overrides.nextCursor ?? null,
  totalCount: overrides.totalCount ?? items.length,
});

describe("AuditLogPage (KAN-194)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-194-01: renders first page of entries newest first with actor, action, target, total count and pagination controls", async () => {
    const entry1 = buildAuditLogEntry({
      actionType: AUDIT_LOG_ACTION_TYPE.BUSINESS_APPROVED,
      actorEmail: "superadmin@platform.com",
      createdAt: new Date("2026-11-07T12:00:00.000Z"),
      id: "log-1",
      targetName: "Barbería Elegance",
    });
    const entry2 = buildAuditLogEntry({
      actionType: AUDIT_LOG_ACTION_TYPE.PLAN_PRICE_CHANGED,
      actorEmail: "billingadmin@platform.com",
      createdAt: new Date("2026-11-06T10:00:00.000Z"),
      id: "log-2",
      targetName: "Plan Pro",
    });

    vi.spyOn(fetchAuditLogPageModule, "fetchAuditLogPage").mockResolvedValue(
      buildPage([entry1, entry2], { totalCount: 2 }),
    );

    renderWithProviders(<AuditLogPage />, {
      initialPath: AUDIT_LOG_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createAuditLogPage();
    const rows = await page.findRows();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("superadmin@platform.com");
    expect(rows[0]).toHaveTextContent(
      testI18n.t("admin:auditLog.actionType.business_approved"),
    );
    expect(rows[0]).toHaveTextContent("Barbería Elegance");

    expect(rows[1]).toHaveTextContent("billingadmin@platform.com");
    expect(rows[1]).toHaveTextContent(
      testI18n.t("admin:auditLog.actionType.plan_price_changed"),
    );
    expect(rows[1]).toHaveTextContent("Plan Pro");

    expect(await page.findPaginationSummary()).toBeInTheDocument();
  });

  it("AC-KAN-194-02: opens detail modal showing before/after values, reason and affected item reference", async () => {
    const entryWithChanges = buildAuditLogEntry({
      actionType: AUDIT_LOG_ACTION_TYPE.BUSINESS_SUSPENDED,
      actorEmail: "security@platform.com",
      after: { status: "suspended" },
      before: { status: "active" },
      id: "log-detail-1",
      reason: "Incumplimiento reiterado de términos de servicio",
      targetId: "business-sus-99",
      targetName: "Spa Relax",
      targetType: "business",
    });

    vi.spyOn(fetchAuditLogPageModule, "fetchAuditLogPage").mockResolvedValue(
      buildPage([entryWithChanges]),
    );

    renderWithProviders(<AuditLogPage />, {
      initialPath: AUDIT_LOG_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createAuditLogPage();
    await page.clickViewDetail(0);

    const modal = await page.findDetailModal();
    expect(modal).toBeInTheDocument();
    expect(
      within(modal).getByText("security@platform.com"),
    ).toBeInTheDocument();
    expect(within(modal).getByText("Spa Relax")).toBeInTheDocument();
    expect(
      within(modal).getByText(
        "Incumplimiento reiterado de términos de servicio",
      ),
    ).toBeInTheDocument();
    expect(
      within(modal).getByText(/"status": "suspended"/),
    ).toBeInTheDocument();
    expect(within(modal).getByText(/"status": "active"/)).toBeInTheDocument();

    await page.clickCloseModal();
    expect(page.queryDetailModal()).toBeNull();
  });

  it("AC-KAN-194-03: ensures strictly read-only view with no edit or delete controls offered", async () => {
    const entry = buildAuditLogEntry();

    vi.spyOn(fetchAuditLogPageModule, "fetchAuditLogPage").mockResolvedValue(
      buildPage([entry]),
    );

    renderWithProviders(<AuditLogPage />, {
      initialPath: AUDIT_LOG_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createAuditLogPage();
    await page.findRows();

    expect(
      screen.queryByRole("button", {
        name: /editar|edit|eliminar|delete|borrar/i,
      }),
    ).toBeNull();

    await page.clickViewDetail(0);
    const modal = await page.findDetailModal();
    expect(
      within(modal).queryByRole("button", {
        name: /editar|edit|eliminar|delete|borrar/i,
      }),
    ).toBeNull();
  });

  it("AC-KAN-194-04: shows empty state when no audit entries exist", async () => {
    vi.spyOn(fetchAuditLogPageModule, "fetchAuditLogPage").mockResolvedValue(
      buildPage([], { totalCount: 0 }),
    );

    renderWithProviders(<AuditLogPage />, {
      initialPath: AUDIT_LOG_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createAuditLogPage();
    expect(await page.findEmptyMessage()).toBeInTheDocument();
  });

  it("AC-KAN-194-05: handles unknown actionType gracefully with fallback representation", async () => {
    const unknownEntry = buildAuditLogEntry({
      actionType: "legacy_system_migrated" as never,
      id: "log-unknown",
      targetName: "Legacy Config",
    });

    vi.spyOn(fetchAuditLogPageModule, "fetchAuditLogPage").mockResolvedValue(
      buildPage([unknownEntry]),
    );

    renderWithProviders(<AuditLogPage />, {
      initialPath: AUDIT_LOG_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createAuditLogPage();
    const rows = await page.findRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(
      /Acción desconocida \(legacy_system_migrated\)/i,
    );
  });

  it("AC-KAN-194-06: displays error state with retry button on network failure and retries successfully", async () => {
    const fetchSpy = vi
      .spyOn(fetchAuditLogPageModule, "fetchAuditLogPage")
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(
        buildPage([buildAuditLogEntry({ targetName: "Retried Business" })]),
      );

    renderWithProviders(<AuditLogPage />, {
      initialPath: AUDIT_LOG_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createAuditLogPage();
    const errorAlert = await page.findErrorAlert();
    expect(errorAlert).toBeInTheDocument();
    expect(
      within(errorAlert).getByText(testI18n.t("common:errors.network")),
    ).toBeInTheDocument();

    await page.clickRetry();

    const rows = await page.findRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Retried Business");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("AC-KAN-194-10: verifies translation for all defined AUDIT_LOG_ACTION_TYPE values", () => {
    const actionTypes = Object.values(AUDIT_LOG_ACTION_TYPE);
    for (const actionType of actionTypes) {
      const translated = testI18n.t(`admin:auditLog.actionType.${actionType}`);
      expect(translated).toBeTruthy();
      expect(translated).not.toBe(`auditLog.actionType.${actionType}`);
    }
  });

  it("AC-KAN-194-12: preserves recorded targetName even if business or plan changes name later", async () => {
    const entry = buildAuditLogEntry({
      targetId: "renamed-biz-id",
      targetName: "Nombre Original Al Momento De La Acción",
    });

    vi.spyOn(fetchAuditLogPageModule, "fetchAuditLogPage").mockResolvedValue(
      buildPage([entry]),
    );

    renderWithProviders(<AuditLogPage />, {
      initialPath: AUDIT_LOG_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createAuditLogPage();
    const rows = await page.findRows();
    expect(rows[0]).toHaveTextContent(
      "Nombre Original Al Momento De La Acción",
    );
  });
});

describe("AuditLog Route Guard (AC-KAN-194-07)", () => {
  const routes: RouteObject[] = [
    ...adminRoutes,
    { element: <p>landing page</p>, path: ROUTE_PATH.LANDING.HOME },
    { element: <p>sign in page</p>, path: ROUTE_PATH.AUTH.SIGN_IN },
    { element: <p>business portal page</p>, path: ROUTE_PATH.BUSINESS.ROOT },
  ];

  it.each([
    ["visitor", SIGNED_OUT_SESSION, "sign in page"],
    ["subscriber", SUBSCRIBER_SESSION, "business portal page"],
    ["customer", CUSTOMER_SESSION, "landing page"],
  ])(
    "redirects unauthorized %s away from /admin/audit-log",
    async (_roleLabel, session, expectedContent) => {
      renderRoutesWithProviders(routes, {
        initialPath: AUDIT_LOG_PATH,
        session,
      });

      await waitFor(() => {
        expect(screen.getByText(expectedContent)).toBeInTheDocument();
      });
    },
  );
});
