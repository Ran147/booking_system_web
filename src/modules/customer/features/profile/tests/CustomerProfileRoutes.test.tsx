import { waitFor } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { BUSINESS_STATUS, USER_ROLE } from "@/domain";
import { SESSION_STATUS } from "@/modules/auth";
import { customerRoutes } from "@/modules/customer";
import { fetchBusinessPublicProfileBySlug } from "@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug";
import {
  COLLABORATOR_SESSION,
  CUSTOMER_SESSION,
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
  testI18n,
} from "@/test-utils";
import { createCustomerProfilePage } from "./CustomerProfilePage.page";
import { fetchCustomerPersonalProfile } from "../api/fetchCustomerPersonalProfile";

vi.mock("../api/fetchCustomerPersonalProfile");
vi.mock("@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug");

const routes: RouteObject[] = [
  ...customerRoutes,
  { element: <p>Sign in</p>, path: "/sign-in" },
  { element: <p>Business</p>, path: "/business" },
  { element: <p>Admin</p>, path: "/admin" },
];

beforeEach(() => {
  vi.mocked(fetchCustomerPersonalProfile).mockReset().mockResolvedValue({
    email: "own@demo.test",
    fullName: "Own Customer",
    phone: null,
  });
  vi.mocked(fetchBusinessPublicProfileBySlug).mockReset().mockResolvedValue({
    contactEmail: null,
    contactPhone: null,
    description: null,
    id: "business-test",
    logoUrl: null,
    name: "Business",
    slug: "business-one",
    socialLinks: [],
    status: BUSINESS_STATUS.ACTIVE,
  });
});

describe("KAN-169 profile routes", () => {
  it.each([
    [SIGNED_OUT_SESSION, "/sign-in"],
    [SUBSCRIBER_SESSION, "/business"],
    [COLLABORATOR_SESSION, "/business"],
    [SUPER_ADMIN_SESSION, "/admin"],
  ])(
    "KAN-169 AC-06: rejects unauthorized sessions (%j)",
    async (session, expectedPath) => {
      const { router } = renderRoutesWithProviders(routes, {
        initialPath: "/business-one/profile",
        session,
      });
      await waitFor(() =>
        expect(router.state.location.pathname).toBe(expectedPath),
      );
      expect(fetchCustomerPersonalProfile).not.toHaveBeenCalled();
      if (session.status === SESSION_STATUS.SIGNED_OUT)
        expect(
          new URLSearchParams(router.state.location.search).get("redirectTo"),
        ).toBe("/business-one/profile");
    },
  );

  it.each([USER_ROLE.CUSTOMER, USER_ROLE.CLIENT])(
    "KAN-169 AC-07 AC-09: direct access ignores malicious UID and uses own session (%s)",
    async (role) => {
      renderRoutesWithProviders(routes, {
        initialPath: "/business-two/profile?userId=someone-else",
        session: { ...CUSTOMER_SESSION, role },
      });
      const page = createCustomerProfilePage();
      expect(await page.findValue("own@demo.test")).toBeInTheDocument();
      expect(fetchCustomerPersonalProfile).toHaveBeenCalledWith(
        CUSTOMER_SESSION.userId,
      );
      expect(page.getReturn()).toHaveAttribute("href", "/business-two");
    },
  );

  it("KAN-169 AC-08: exposes profile access on the home and returns to the same slug", async () => {
    const { router } = renderRoutesWithProviders(routes, {
      initialPath: "/business-one",
      session: CUSTOMER_SESSION,
    });
    const page = createCustomerProfilePage();
    await page.findValue(testI18n.t("customer:profile.description"));
    expect(fetchCustomerPersonalProfile).not.toHaveBeenCalled();
    await page.clickOpen();
    await page.findValue("own@demo.test");
    expect(router.state.location.pathname).toBe("/business-one/profile");
    await page.clickReturn();
    expect(router.state.location.pathname).toBe("/business-one");
  });

  it("KAN-169 AC-09: a missing business retains the layout outcome and does not read the user", async () => {
    vi.mocked(fetchBusinessPublicProfileBySlug).mockResolvedValue(null);
    renderRoutesWithProviders(routes, {
      initialPath: "/missing/profile",
      session: CUSTOMER_SESSION,
    });
    const page = createCustomerProfilePage();
    await page.findValue(testI18n.t("customer:layout.businessNotFound"));
    expect(fetchCustomerPersonalProfile).not.toHaveBeenCalled();
  });
});
