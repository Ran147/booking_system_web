import { screen, waitFor } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { LANGUAGE } from "@/constants";
import {
  BUSINESS_STATUS,
  SOCIAL_NETWORK,
  type BusinessPublicProfile,
} from "@/domain";
import type { Session } from "@/modules/auth";
import { fetchUserLanguage } from "@/modules/auth/api/fetchUserLanguage";
import {
  CUSTOMER_SESSION,
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  testI18n,
} from "@/test-utils";
import { CustomerLayout } from "../CustomerLayout";
import { createCustomerFooterPage } from "./CustomerFooter.page";
import { fetchBusinessPublicProfileBySlug } from "../api/fetchBusinessPublicProfileBySlug";

vi.mock("../api/fetchBusinessPublicProfileBySlug");
vi.mock("@/modules/auth/api/fetchUserLanguage");

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

const renderLayout = (session: Session = SIGNED_OUT_SESSION): void => {
  renderRoutesWithProviders(ROUTES, {
    initialPath: "/negocio-real",
    session,
  });
};

describe("CustomerLayout", () => {
  beforeEach(() => {
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: null });
  });

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

  it("KAN-172: applies the remote language for a restored customer session", async () => {
    vi.mocked(fetchBusinessPublicProfileBySlug).mockResolvedValue(
      BUSINESS_PROFILE,
    );
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.EN });

    renderLayout(CUSTOMER_SESSION);

    await waitFor(() => expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN));
    expect(fetchUserLanguage).toHaveBeenCalledWith(CUSTOMER_SESSION.userId);
  });

  it("KAN-117: exposes an accessible loading state", () => {
    vi.mocked(fetchBusinessPublicProfileBySlug).mockReturnValue(
      new Promise(() => undefined),
    );

    renderLayout();

    expect(screen.getByRole("status")).toHaveAccessibleName(
      testI18n.t("status.loading"),
    );
    expect(screen.queryByText("Contenido Customer")).not.toBeInTheDocument();
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
    expect(screen.queryByText("Contenido Customer")).not.toBeInTheDocument();
    expect(createCustomerFooterPage().getTermsLink()).toBeInTheDocument();
  });

  it("KAN-117: reports an unknown slug and keeps legal navigation", async () => {
    vi.mocked(fetchBusinessPublicProfileBySlug).mockResolvedValue(null);

    renderLayout();

    expect(
      await screen.findByText(testI18n.t("customer:layout.businessNotFound")),
    ).toBeInTheDocument();
    expect(screen.queryByText("Contenido Customer")).not.toBeInTheDocument();
    expect(createCustomerFooterPage().getTermsLink()).toBeInTheDocument();
  });
});
