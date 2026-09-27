import { ROUTE_PATH } from "@/shared/constants";
import { renderRoutesWithProviders } from "@/shared/test-utils/renderRoutesWithProviders";
import {
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
} from "@/shared/test-utils/sessionFixtures";
import { testI18n } from "@/shared/test-utils/testI18n";
import { appRoutes } from "../appRoutes";
import { createAppRoutesPage } from "./AppRoutes.page";

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

  it("shows the customer portal shell without signing in", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: ROUTE_PATH.CUSTOMER.ROOT,
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
      await appRoutesPage.findPageHeading(
        testI18n.t("signInPlaceholder.title"),
      ),
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

  it("redirects a customer away from the admin portal", async () => {
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

  it("shows the not found page for an unknown path", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: "/unknown-path",
      session: SIGNED_OUT_SESSION,
    });
    const appRoutesPage = createAppRoutesPage();

    expect(
      await appRoutesPage.findPageHeading(testI18n.t("notFound.title")),
    ).toBeInTheDocument();
  });
});
