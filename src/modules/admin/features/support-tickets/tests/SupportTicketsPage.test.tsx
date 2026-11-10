import { screen, waitFor } from "@testing-library/react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { RouteObject } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { FUNCTION_NAME } from "@/constants";
import { SUPPORT_TICKET_STATUS, type SupportTicket } from "@/domain";
import { adminRoutes } from "@/modules/admin/admin.routes";
import * as callFunctionModule from "@/services/firebase/callFunction";
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
import { SupportTicketsPage } from "../SupportTicketsPage";
import { createSupportTicketsPage } from "./SupportTicketsPage.page";
import * as fetchSupportTicketsPageModule from "../api/fetchSupportTicketsPage";

const SUPPORT_TICKETS_PATH = `${ROUTE_PATH.ADMIN.ROOT}/${ROUTE_PATH.ADMIN.SUPPORT_TICKETS}`;

const buildTicket = (
  overrides: Partial<SupportTicket> = {},
): SupportTicket => ({
  businessId: "biz-1",
  businessName: "Barbería Elegance",
  createdAt: new Date("2026-11-10T10:00:00.000Z"),
  createdByUserId: "user-1",
  id: "ticket-1",
  message: "No puedo configurar los horarios de los colaboradores.",
  ownerEmail: "dueno@elegance.com",
  replies: [],
  resolvedAt: null,
  status: SUPPORT_TICKET_STATUS.OPEN,
  subject: "Problema con horarios",
  updatedAt: new Date("2026-11-10T10:00:00.000Z"),
  ...overrides,
});

const buildPage = (
  items: SupportTicket[],
  overrides: { nextCursor?: QueryDocumentSnapshot; totalCount?: number } = {},
): Awaited<
  ReturnType<typeof fetchSupportTicketsPageModule.fetchSupportTicketsPage>
> => ({
  items,
  nextCursor: overrides.nextCursor ?? null,
  totalCount: overrides.totalCount ?? items.length,
});

describe("SupportTicketsPage (KAN-190)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-190-01: renders first page of tickets newest first with subject, business, dates, status badge and pagination", async () => {
    const ticket1 = buildTicket({
      businessName: "Barbería Elegance",
      createdAt: new Date("2026-11-10T12:00:00.000Z"),
      id: "t-1",
      status: SUPPORT_TICKET_STATUS.OPEN,
      subject: "Duda con servicios",
    });
    const ticket2 = buildTicket({
      businessName: "Spa Serenidad",
      createdAt: new Date("2026-11-09T10:00:00.000Z"),
      id: "t-2",
      status: SUPPORT_TICKET_STATUS.IN_PROGRESS,
      subject: "Error de facturación",
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticket1, ticket2], { totalCount: 2 }));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    const rows = await page.findRows();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Barbería Elegance");
    expect(rows[0]).toHaveTextContent("Duda con servicios");
    expect(rows[0]).toHaveTextContent(
      testI18n.t("admin:supportTickets.status.open"),
    );

    expect(rows[1]).toHaveTextContent("Spa Serenidad");
    expect(rows[1]).toHaveTextContent("Error de facturación");
    expect(rows[1]).toHaveTextContent(
      testI18n.t("admin:supportTickets.status.in_progress"),
    );

    expect(await page.findPaginationSummary()).toBeInTheDocument();
  });

  it("AC-KAN-190-02: filters tickets by status, updates results, keeps filter in URL and restarts pagination", async () => {
    const fetchSpy = vi
      .spyOn(fetchSupportTicketsPageModule, "fetchSupportTicketsPage")
      .mockResolvedValue(buildPage([]));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.selectStatusFilter(
      testI18n.t("admin:supportTickets.status.in_progress"),
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { status: SUPPORT_TICKET_STATUS.IN_PROGRESS },
        }),
      );
    });

    // Clear filter
    await page.clickClearFilter();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { status: null },
        }),
      );
    });
  });

  it("AC-KAN-190-03: opens detail modal showing original message, business name, owner email and replies in order", async () => {
    const ticketWithReplies = buildTicket({
      businessName: "Gimnasio Fuerza",
      id: "t-replied",
      message: "Requiero asistencia para sincronizar reservas.",
      ownerEmail: "owner@gimnasio.com",
      replies: [
        {
          body: "Estamos atendiendo tu solicitud.",
          id: "r-1",
          sentAt: new Date("2026-11-10T10:30:00.000Z"),
          sentByEmail: "support@platform.com",
          sentByUserId: "admin-sa-1",
        },
      ],
      status: SUPPORT_TICKET_STATUS.IN_PROGRESS,
      subject: "Sincronización reservas",
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticketWithReplies]));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    const modal = await page.findDetailModal();
    expect(modal).toHaveTextContent("Gimnasio Fuerza");
    expect(modal).toHaveTextContent("owner@gimnasio.com");
    expect(modal).toHaveTextContent(
      "Requiero asistencia para sincronizar reservas.",
    );
    expect(modal).toHaveTextContent("Estamos atendiendo tu solicitud.");
    expect(modal).toHaveTextContent("support@platform.com");

    await page.clickCloseDetail();
    expect(page.queryDetailModal()).toBeNull();
  });

  it("AC-KAN-190-04: shows empty state when no tickets match the query or filter", async () => {
    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([], { totalCount: 0 }));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    expect(await page.findEmptyMessage()).toBeInTheDocument();
  });

  it("AC-KAN-190-05: displays ownerUnavailable fallback when business owner email is missing", async () => {
    const ticketNoEmail = buildTicket({
      id: "t-no-email",
      ownerEmail: null,
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticketNoEmail]));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    const modal = await page.findDetailModal();
    expect(modal).toHaveTextContent(
      testI18n.t("admin:supportTickets.detail.ownerUnavailable"),
    );
  });

  it("AC-KAN-190-06: shows error state with retry button on network failure and re-queries upon click", async () => {
    const fetchSpy = vi
      .spyOn(fetchSupportTicketsPageModule, "fetchSupportTicketsPage")
      .mockRejectedValueOnce(new Error("Network failure"))
      .mockResolvedValueOnce(buildPage([]));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    expect(await page.findErrorAlert()).toBeInTheDocument();

    await page.clickRetry();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});

describe("SupportTickets Route Guard (AC-KAN-190-07)", () => {
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
    "redirects unauthorized %s away from /admin/support-tickets",
    async (_roleLabel, session, expectedContent) => {
      renderRoutesWithProviders(routes, {
        initialPath: SUPPORT_TICKETS_PATH,
        session,
      });

      await waitFor(() => {
        expect(screen.getByText(expectedContent)).toBeInTheDocument();
      });
    },
  );
});

describe("SupportTickets Reply (KAN-191)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-191-01 / AC-KAN-191-02 / AC-KAN-191-03: submits reply, calls replyToSupportTicket, updates ticket replies, transitions status and shows success toast", async () => {
    const ticket = buildTicket({
      id: "ticket-reply-1",
      status: SUPPORT_TICKET_STATUS.OPEN,
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticket]));

    const toastSuccessSpy = vi.spyOn(toast, "success");
    const callFunctionSpy = vi
      .spyOn(callFunctionModule, "callFunction")
      .mockResolvedValueOnce({
        reply: {
          body: "Estamos revisando tu caso detalladamente.",
          emailFailed: false,
          id: "new-reply-123",
          sentAt: new Date().toISOString(),
          sentByEmail: "support@platform.com",
          sentByUserId: "admin-sa-1",
        },
        status: SUPPORT_TICKET_STATUS.IN_PROGRESS,
      });

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    const modal = await page.findDetailModal();
    expect(modal).toBeInTheDocument();

    await page.fillReplyBody("Estamos revisando tu caso detalladamente.");
    await page.clickSendReply();

    await waitFor(() => {
      expect(callFunctionSpy).toHaveBeenCalledWith(
        FUNCTION_NAME.REPLY_TO_SUPPORT_TICKET,
        {
          body: "Estamos revisando tu caso detalladamente.",
          ticketId: "ticket-reply-1",
        },
      );
    });

    await waitFor(() => {
      expect(toastSuccessSpy).toHaveBeenCalledWith(
        testI18n.t("admin:supportTickets.reply.successToast"),
      );
    });

    expect(
      await screen.findByText("Estamos revisando tu caso detalladamente."),
    ).toBeInTheDocument();
  });

  it("AC-KAN-191-04: keeps send reply button disabled when body is empty or whitespace", async () => {
    const ticket = buildTicket({
      id: "ticket-reply-2",
      status: SUPPORT_TICKET_STATUS.OPEN,
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticket]));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    const submitButton = await page.findSubmitReplyButton();
    expect(submitButton).toBeDisabled();

    await page.fillReplyBody("     ");
    expect(submitButton).toBeDisabled();
  });

  it("AC-KAN-191-06: displays warning notice on replies where email delivery failed", async () => {
    const ticketWithFailedEmail = buildTicket({
      id: "ticket-failed-email",
      replies: [
        {
          body: "Respuesta con error de correo.",
          emailFailed: true,
          id: "r-failed-1",
          sentAt: new Date("2026-11-10T12:00:00.000Z"),
          sentByEmail: "support@platform.com",
          sentByUserId: "admin-sa-1",
        },
      ],
      status: SUPPORT_TICKET_STATUS.IN_PROGRESS,
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticketWithFailedEmail]));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    expect(
      await screen.findByText(
        testI18n.t("admin:supportTickets.reply.emailFailed"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-191-08: renders resolved notice and disables reply form when ticket is resolved", async () => {
    const resolvedTicket = buildTicket({
      id: "ticket-resolved",
      status: SUPPORT_TICKET_STATUS.RESOLVED,
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([resolvedTicket]));

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    expect(await page.findResolvedNotice()).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: testI18n.t("admin:supportTickets.reply.submitButton"),
      }),
    ).toBeNull();
  });
});

describe("SupportTickets Resolve (KAN-192)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-192-01 / AC-KAN-192-02 / AC-KAN-192-03 / AC-KAN-192-04: opens confirmation modal, resolves ticket, updates status and shows toast", async () => {
    const ticket = buildTicket({
      id: "ticket-resolve-1",
      status: SUPPORT_TICKET_STATUS.IN_PROGRESS,
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticket]));

    const toastSuccessSpy = vi.spyOn(toast, "success");
    const callFunctionSpy = vi
      .spyOn(callFunctionModule, "callFunction")
      .mockResolvedValueOnce({
        resolvedAt: new Date().toISOString(),
        status: SUPPORT_TICKET_STATUS.RESOLVED,
        ticketId: "ticket-resolve-1",
      });

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    await page.clickMarkAsResolved();
    expect(await page.findResolveConfirmationModal()).toBeInTheDocument();

    await page.clickConfirmResolve();

    await waitFor(() => {
      expect(callFunctionSpy).toHaveBeenCalledWith(
        FUNCTION_NAME.RESOLVE_SUPPORT_TICKET,
        { ticketId: "ticket-resolve-1" },
      );
    });

    await waitFor(() => {
      expect(toastSuccessSpy).toHaveBeenCalledWith(
        testI18n.t("admin:supportTickets.resolve.successToast"),
      );
    });

    expect(await page.findResolvedNotice()).toBeInTheDocument();
    expect(page.queryMarkAsResolvedButton()).toBeNull();
  });

  it("AC-KAN-192-05: shows error toast when resolving ticket fails", async () => {
    const ticket = buildTicket({
      id: "ticket-resolve-fail",
      status: SUPPORT_TICKET_STATUS.OPEN,
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticket]));

    const toastErrorSpy = vi.spyOn(toast, "error");
    vi.spyOn(callFunctionModule, "callFunction").mockRejectedValueOnce(
      new Error("Server error"),
    );

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    await page.clickMarkAsResolved();
    await page.clickConfirmResolve();

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith("Server error");
    });
  });

  it("AC-KAN-192-08: cancels resolve dialog without calling resolve function", async () => {
    const ticket = buildTicket({
      id: "ticket-resolve-cancel",
      status: SUPPORT_TICKET_STATUS.OPEN,
    });

    vi.spyOn(
      fetchSupportTicketsPageModule,
      "fetchSupportTicketsPage",
    ).mockResolvedValue(buildPage([ticket]));

    const callFunctionSpy = vi.spyOn(callFunctionModule, "callFunction");

    renderWithProviders(<SupportTicketsPage />, {
      initialPath: SUPPORT_TICKETS_PATH,
      session: SUPER_ADMIN_SESSION,
    });

    const page = createSupportTicketsPage();
    await page.clickViewDetail(0);

    await page.clickMarkAsResolved();
    expect(await page.findResolveConfirmationModal()).toBeInTheDocument();

    await page.clickCancelResolve();

    expect(callFunctionSpy).not.toHaveBeenCalled();
  });
});
