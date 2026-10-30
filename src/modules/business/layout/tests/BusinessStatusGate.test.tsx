import { focusManager } from "@tanstack/react-query";
import { act, screen } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import type { RouteObject } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FIREBASE_ERROR_CODE, ROUTE_PATH, STRING } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { CurrentPathProbe } from "@/modules/auth/tests/CurrentPathProbe";
import { DEFAULT_LANDING_FOOTER_CONFIG } from "@/modules/landing/layout/constants";
import {
  renderRoutesWithProviders,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/test-utils";
import {
  createBusinessStatusGatePage,
  PORTAL_CONTENT_TEXT,
} from "./BusinessStatusGate.page";
import { fetchBusinessGate } from "../api/fetchBusinessGate";
import { BusinessStatusGate } from "../components";
import type { BusinessGate } from "../models";

vi.mock("../api/fetchBusinessGate");
vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseAuth>()),
  signOut: vi.fn(),
}));

const PENDING_BUSINESS: BusinessGate = {
  name: "Barbería Pendiente",
  rejectionReason: null,
  signedUpAt: new Date("2026-10-15T15:30:00Z"),
  status: BUSINESS_STATUS.PENDING,
  timeZone: "America/Costa_Rica",
};

const REJECTED_BUSINESS: BusinessGate = {
  ...PENDING_BUSINESS,
  name: "Barbería Rechazada",
  rejectionReason: "Los datos de contacto del negocio no son válidos.",
  status: BUSINESS_STATUS.REJECTED,
};

const ACTIVE_BUSINESS: BusinessGate = {
  ...PENDING_BUSINESS,
  status: BUSINESS_STATUS.ACTIVE,
};

const testRoutes: RouteObject[] = [
  {
    children: [
      {
        element: <nav aria-label="sidebar">{PORTAL_CONTENT_TEXT}</nav>,
        path: ROUTE_PATH.BUSINESS.ROOT,
      },
    ],
    element: <BusinessStatusGate />,
  },
  { element: <CurrentPathProbe />, path: ROUTE_PATH.AUTH.SIGN_IN },
];

const renderGate = (): ReturnType<typeof createBusinessStatusGatePage> => {
  renderRoutesWithProviders(testRoutes, {
    initialPath: ROUTE_PATH.BUSINESS.ROOT,
    session: SUBSCRIBER_SESSION,
  });
  return createBusinessStatusGatePage();
};

describe("BusinessStatusGate (US-33: AC-KAN-33-09 … 12, AC-KAN-39-07)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    focusManager.setFocused(undefined);
  });

  it("AC-KAN-33-09: shows the under-review screen with the business and the sign-up date", async () => {
    vi.mocked(fetchBusinessGate).mockResolvedValue(PENDING_BUSINESS);
    const gatePage = renderGate();

    expect(
      await gatePage.findScreenTitle(
        testI18n.t("business:pendingApproval.title"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(PENDING_BUSINESS.name)).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("business:pendingApproval.signUpDateLabel")),
    ).toBeInTheDocument();
    expect(fetchBusinessGate).toHaveBeenCalledWith(
      SUBSCRIBER_SESSION.businessId,
    );
  });

  it("AC-KAN-33-09: hides the sign-up date while the business does not store it", async () => {
    vi.mocked(fetchBusinessGate).mockResolvedValue({
      ...PENDING_BUSINESS,
      signedUpAt: null,
    });
    const gatePage = renderGate();

    await gatePage.findScreenTitle(
      testI18n.t("business:pendingApproval.title"),
    );
    expect(
      screen.queryByText(
        testI18n.t("business:pendingApproval.signUpDateLabel"),
      ),
    ).toBeNull();
  });

  it("AC-KAN-39-07: mounts neither the sidebar nor any portal screen while the business is pending", async () => {
    vi.mocked(fetchBusinessGate).mockResolvedValue(PENDING_BUSINESS);
    const gatePage = renderGate();

    await gatePage.findScreenTitle(
      testI18n.t("business:pendingApproval.title"),
    );
    expect(gatePage.queryNavigation()).toBeNull();
    expect(gatePage.queryPortalContent()).toBeNull();
  });

  it("AC-KAN-33-10: shows the portal when the tab regains focus after the approval", async () => {
    vi.mocked(fetchBusinessGate)
      .mockResolvedValueOnce(PENDING_BUSINESS)
      .mockResolvedValue(ACTIVE_BUSINESS);
    const gatePage = renderGate();
    await gatePage.findScreenTitle(
      testI18n.t("business:pendingApproval.title"),
    );

    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    expect(await gatePage.findPortalContent()).toBeInTheDocument();
  });

  it("AC-KAN-33-11: shows the rejected screen with the reason and the platform contact, without the portal", async () => {
    vi.mocked(fetchBusinessGate).mockResolvedValue(REJECTED_BUSINESS);
    const gatePage = renderGate();

    expect(
      await gatePage.findScreenTitle(testI18n.t("business:rejected.title")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(REJECTED_BUSINESS.rejectionReason ?? STRING.EMPTY),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: DEFAULT_LANDING_FOOTER_CONFIG.EMAIL }),
    ).toHaveAttribute("href", `mailto:${DEFAULT_LANDING_FOOTER_CONFIG.EMAIL}`);
    expect(gatePage.queryPortalContent()).toBeNull();
  });

  it("AC-KAN-33-11: signs out from the rejected screen", async () => {
    vi.mocked(fetchBusinessGate).mockResolvedValue(REJECTED_BUSINESS);
    vi.mocked(FirebaseAuth.signOut).mockResolvedValue();
    const gatePage = renderGate();
    await gatePage.findScreenTitle(testI18n.t("business:rejected.title"));

    await gatePage.clickSignOut();

    expect(FirebaseAuth.signOut).toHaveBeenCalledTimes(1);
    expect(await gatePage.findCurrentPath()).toBe(ROUTE_PATH.AUTH.SIGN_IN);
  });

  it("AC-KAN-33-12: shows the network error without business data, and the retry loads the portal", async () => {
    vi.mocked(fetchBusinessGate)
      .mockRejectedValueOnce(
        new FirebaseError(FIREBASE_ERROR_CODE.UNAVAILABLE, "offline"),
      )
      .mockResolvedValue(ACTIVE_BUSINESS);
    const gatePage = renderGate();

    expect(await gatePage.findErrorAlert()).toHaveTextContent(
      testI18n.t("common:errors.network"),
    );
    expect(gatePage.queryPortalContent()).toBeNull();

    await gatePage.clickRetry();

    expect(await gatePage.findPortalContent()).toBeInTheDocument();
  });

  it("AC-KAN-33-12: treats a missing business as an error, never as active", async () => {
    vi.mocked(fetchBusinessGate).mockRejectedValue(new Error("missing"));
    const gatePage = renderGate();

    expect(await gatePage.findErrorAlert()).toHaveTextContent(
      testI18n.t("common:errors.unknown"),
    );
    expect(gatePage.queryPortalContent()).toBeNull();
  });

  it.each([
    BUSINESS_STATUS.ACTIVE,
    BUSINESS_STATUS.INACTIVE,
    BUSINESS_STATUS.SUSPENDED,
  ])("D-1: shows the portal for a %s business", async (businessStatus) => {
    vi.mocked(fetchBusinessGate).mockResolvedValue({
      ...PENDING_BUSINESS,
      status: businessStatus,
    });
    const gatePage = renderGate();

    expect(await gatePage.findPortalContent()).toBeInTheDocument();
  });
});
