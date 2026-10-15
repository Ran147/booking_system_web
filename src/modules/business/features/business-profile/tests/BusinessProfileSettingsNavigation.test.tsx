import { ROUTE_PATH } from "@/constants";
import { BUSINESS_STATUS, type BusinessPublicProfile } from "@/domain";
import { businessRoutes } from "@/modules/business/business.routes";
import { fetchBusinessStatus } from "@/modules/business/features/home";
import { renderRoutesWithProviders, SUBSCRIBER_SESSION } from "@/test-utils";
import { createBusinessProfileSettingsNavigationPage } from "./BusinessProfileSettingsNavigation.page";
import { fetchBusinessPublicProfile } from "../api/fetchBusinessPublicProfile";

vi.mock("../api/fetchBusinessPublicProfile");
vi.mock("@/modules/business/features/home", async () => {
  const actualModule = await vi.importActual<Record<string, unknown>>(
    "@/modules/business/features/home",
  );
  return { ...actualModule, fetchBusinessStatus: vi.fn() };
});

const BUSINESS_PROFILE = {
  contactEmail: null,
  contactPhone: null,
  description: null,
  id: SUBSCRIBER_SESSION.businessId,
  logoUrl: null,
  name: "Negocio de prueba",
  slug: "negocio-de-prueba",
  socialLinks: [],
  status: BUSINESS_STATUS.ACTIVE,
} satisfies BusinessPublicProfile;

describe("business profile navigation from settings", () => {
  beforeEach(() => {
    vi.mocked(fetchBusinessPublicProfile).mockResolvedValue(BUSINESS_PROFILE);
    vi.mocked(fetchBusinessStatus).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
  });

  it("KAN-199: opens the guarded existing business-profile page", async () => {
    renderRoutesWithProviders(businessRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessProfileSettingsNavigationPage();
    await page.findSettingsHeading();

    await page.clickBusinessProfileLink();

    expect(await page.findBusinessNameInput()).toHaveValue(
      BUSINESS_PROFILE.name,
    );
    expect(fetchBusinessPublicProfile).toHaveBeenCalledWith(
      SUBSCRIBER_SESSION.businessId,
    );
  });
});
