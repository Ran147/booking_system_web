import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BUSINESS_STATUS } from "@/domain";
import { fetchBusinessPublicProfileBySlug } from "@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug";
import { ROUTE_PATH } from "@/shared/constants";
import { RESERVED_BUSINESS_SLUG } from "@/shared/domain";
import { renderRoutesWithProviders } from "@/shared/test-utils/renderRoutesWithProviders";
import {
  BUSINESS_OWNER_SESSION,
  COLLABORATOR_SESSION,
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
} from "@/shared/test-utils/sessionFixtures";
import { testI18n } from "@/shared/test-utils/testI18n";
import { appRoutes } from "../appRoutes";
import { createAppRoutesPage } from "./AppRoutes.page";

const BUSINESS_PAGE_PATH = "/barberia-centro";

vi.mock("@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug");

beforeEach(() => {
  vi.mocked(fetchBusinessPublicProfileBySlug).mockResolvedValue({
    contactEmail: null,
    contactPhone: null,
    description: null,
    id: "business-id",
    logoUrl: null,
    name: "Barbería Centro",
    slug: "barberia-centro",
    socialLinks: [],
    status: BUSINESS_STATUS.ACTIVE,
  });
});

describe("app routes", () => {
  it("shows the landing portal to a visitor", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("landing:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-112: shows the customer portal of a business slug without signing in", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: BUSINESS_PAGE_PATH,
      session: SIGNED_OUT_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("customer:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-28: sends a signed-out visitor from the business portal to sign-in", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SIGNED_OUT_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(testI18n.t("auth.signIn.title")),
    ).toBeInTheDocument();
  });

  it("KAN-28: opens the business portal for a subscriber", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("business:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-86: opens the business portal for a collaborator of the business", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: COLLABORATOR_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("business:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-199: opens the business portal for a business owner", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: BUSINESS_OWNER_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("business:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it.each([
    ["business owner", BUSINESS_OWNER_SESSION],
    ["subscriber", SUBSCRIBER_SESSION],
    ["collaborator", COLLABORATOR_SESSION],
  ])(
    "KAN-53: opens business settings for an authenticated %s",
    async (_roleName, session) => {
      renderRoutesWithProviders(appRoutes, {
        initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS}`,
        session,
      });
      const appRoutesPage = createAppRoutesPage();

      expect(
        await appRoutesPage.findPageHeading(
          testI18n.t("business:settings.title"),
        ),
      ).toBeInTheDocument();
    },
  );

  it.each([
    ["business owner", BUSINESS_OWNER_SESSION],
    ["subscriber", SUBSCRIBER_SESSION],
    ["collaborator", COLLABORATOR_SESSION],
  ])(
    "KAN-53: lets an authenticated %s navigate from settings to the password view",
    async (_roleName, session) => {
      const user = userEvent.setup();
      renderRoutesWithProviders(appRoutes, {
        initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS}`,
        session,
      });

      await user.click(
        await screen.findByRole("link", {
          name: testI18n.t("business:settings.navigation.password.action"),
        }),
      );

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: testI18n.t("business:settings.password.title"),
        }),
      ).toBeInTheDocument();
    },
  );

  it.each([
    ["business owner", BUSINESS_OWNER_SESSION],
    ["subscriber", SUBSCRIBER_SESSION],
    ["collaborator", COLLABORATOR_SESSION],
  ])(
    "KAN-53: allows an authenticated %s to open password settings directly",
    async (_roleName, session) => {
      renderRoutesWithProviders(appRoutes, {
        initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS_PASSWORD}`,
        session,
      });

      expect(
        await screen.findByLabelText(
          testI18n.t("business:settings.password.currentPasswordLabel"),
          { exact: false, selector: 'input[name="currentPassword"]' },
        ),
      ).toBeInTheDocument();
    },
  );

  it("KAN-199: keeps direct business-profile access blocked for collaborators", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.BUSINESS_PROFILE}`,
      session: COLLABORATOR_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: testI18n.t("business:placeholder.title"),
      }),
    ).toBeInTheDocument();
  });

  it("KAN-199: allows a business owner to open the business profile", async () => {
    const { router } = renderRoutesWithProviders(appRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.BUSINESS_PROFILE}`,
      session: BUSINESS_OWNER_SESSION,
    });

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.BUSINESS_PROFILE}`,
      ),
    );
  });

  it("KAN-86: redirects a collaborator from the admin portal to the business portal", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.ADMIN.ROOT,
      session: COLLABORATOR_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("business:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it("opens the admin portal for a super admin", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.ADMIN.ROOT,
      session: SUPER_ADMIN_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("admin:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-129-06: redirects a customer from the admin portal to their portal home (landing until KAN-150)", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.ADMIN.ROOT,
      session: CUSTOMER_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("landing:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-112: keeps a reserved segment on its static portal instead of a business", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: `/${RESERVED_BUSINESS_SLUG.ADMIN}`,
      session: SUPER_ADMIN_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(
        testI18n.t("admin:placeholder.title"),
      ),
    ).toBeInTheDocument();
  });

  it("shows the not found page for an unknown path under a business slug", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: `${BUSINESS_PAGE_PATH}/unknown-path`,
      session: SIGNED_OUT_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(testI18n.t("notFound.title")),
    ).toBeInTheDocument();
  });
});
