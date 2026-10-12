import { screen } from "@testing-library/react";
import type { RouteObject } from "react-router";
import {
  BUSINESS_STATUS,
  SOCIAL_NETWORK,
  type BusinessPublicProfile,
} from "@/domain";
import {
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  testI18n,
} from "@/test-utils";
import { CustomerLayout } from "../CustomerLayout";
import { createCustomerFooterPage } from "./CustomerFooter.page";
import { fetchBusinessPublicProfileBySlug } from "../api/fetchBusinessPublicProfileBySlug";

vi.mock("../api/fetchBusinessPublicProfileBySlug");

const BUSINESS_PROFILE = {
  contactEmail: "contacto@negocio.test",
  contactPhone: "+506 2222-3333",
  description: null,
  id: "business-id",
  logoUrl: null,
  name: "Negocio real",
  slug: "negocio-real",
  socialLinks: [
    {
      network: SOCIAL_NETWORK.INSTAGRAM,
      url: "https://instagram.com/negocio-real",
    },
  ],
  status: BUSINESS_STATUS.ACTIVE,
} satisfies BusinessPublicProfile;

const ROUTES: RouteObject[] = [
  {
    children: [{ element: <p>Contenido Customer</p>, index: true }],
    element: <CustomerLayout />,
    path: "/:businessSlug",
  },
];

const renderLayout = (): void => {
  renderRoutesWithProviders(ROUTES, {
    initialPath: "/negocio-real",
    session: SIGNED_OUT_SESSION,
  });
};

describe("CustomerLayout", () => {
  it("KAN-117: shares the profile resolved from the URL with the footer", async () => {
    vi.mocked(fetchBusinessPublicProfileBySlug).mockResolvedValue(
      BUSINESS_PROFILE,
    );

    renderLayout();

    expect(await screen.findByText(BUSINESS_PROFILE.name)).toBeInTheDocument();
    expect(fetchBusinessPublicProfileBySlug).toHaveBeenCalledWith(
      BUSINESS_PROFILE.slug,
    );
    expect(screen.getByText("Contenido Customer")).toBeInTheDocument();
  });

  it("KAN-117: exposes an accessible loading state", () => {
    vi.mocked(fetchBusinessPublicProfileBySlug).mockReturnValue(
      new Promise(() => undefined),
    );

    renderLayout();

    expect(screen.getByRole("status")).toHaveAccessibleName(
      testI18n.t("status.loading"),
    );
    expect(createCustomerFooterPage().getTermsLink()).toBeInTheDocument();
  });

  it("KAN-117: reports query failures without inventing business data", async () => {
    vi.mocked(fetchBusinessPublicProfileBySlug).mockRejectedValue(
      new Error("offline"),
    );

    renderLayout();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("errors.unknown"),
    );
    expect(screen.queryByText(BUSINESS_PROFILE.name)).not.toBeInTheDocument();
    expect(createCustomerFooterPage().getTermsLink()).toBeInTheDocument();
  });

  it("KAN-117: reports an unknown slug and keeps legal navigation", async () => {
    vi.mocked(fetchBusinessPublicProfileBySlug).mockResolvedValue(null);

    renderLayout();

    expect(
      await screen.findByText(testI18n.t("customer:layout.businessNotFound")),
    ).toBeInTheDocument();
    expect(createCustomerFooterPage().getTermsLink()).toBeInTheDocument();
  });
});
