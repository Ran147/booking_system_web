import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BUSINESS_STATUS,
  SOCIAL_NETWORK,
  type BusinessPublicProfile,
} from "@/domain";
import {
  renderWithProviders,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/test-utils";
import { BusinessProfilePage } from "../BusinessProfilePage";
import { createBusinessProfilePage } from "./BusinessProfilePage.page";
import { fetchBusinessPublicProfile } from "../api/fetchBusinessPublicProfile";
import { saveBusinessPublicProfile } from "../api/saveBusinessPublicProfile";

vi.mock("../api/fetchBusinessPublicProfile");
vi.mock("../api/saveBusinessPublicProfile");

const FACEBOOK_URL = "https://facebook.com/barberia";
const profile = {
  contactEmail: "hola@barberia.test",
  contactPhone: "+506 2222-2222",
  description: "Cortes con atención personalizada.",
  id: SUBSCRIBER_SESSION.businessId,
  logoUrl: null,
  name: "Barbería Centro",
  slug: "barberia-centro",
  socialLinks: [{ network: SOCIAL_NETWORK.FACEBOOK, url: FACEBOOK_URL }],
  status: BUSINESS_STATUS.ACTIVE,
} satisfies BusinessPublicProfile;

describe("BusinessProfilePage", () => {
  beforeEach(() => {
    vi.mocked(fetchBusinessPublicProfile).mockResolvedValue(profile);
    vi.mocked(saveBusinessPublicProfile).mockResolvedValue();
  });

  it("KAN-199: loads the current public profile", async () => {
    renderWithProviders(<BusinessProfilePage />, {
      initialPath: "/business/business-profile",
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessProfilePage();

    expect(await page.findNameInput()).toHaveValue(profile.name);
    expect(page.getDescriptionInput()).toHaveValue(profile.description);
    expect(page.getFacebookInput()).toHaveValue(FACEBOOK_URL);
  });

  it("KAN-199: saves changes scoped to the signed-in business", async () => {
    renderWithProviders(<BusinessProfilePage />, {
      initialPath: "/business/business-profile",
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessProfilePage();

    await page.replaceName("Nuevo nombre");
    await page.clickSave();

    await waitFor(() => expect(saveBusinessPublicProfile).toHaveBeenCalled());
    expect(vi.mocked(saveBusinessPublicProfile).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        businessId: SUBSCRIBER_SESSION.businessId,
        values: expect.objectContaining({ name: "Nuevo nombre" }),
      }),
    );
  });

  it("KAN-199: rejects social links that are not HTTPS", async () => {
    renderWithProviders(<BusinessProfilePage />, {
      initialPath: "/business/business-profile",
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessProfilePage();

    await page.findNameInput();
    const user = userEvent.setup();
    await user.clear(page.getFacebookInput());
    await user.type(page.getFacebookInput(), "http://example.com");
    await page.clickSave();

    expect(
      await screen.findByText(testI18n.t("validation:urlInvalid")),
    ).toBeInTheDocument();
    expect(saveBusinessPublicProfile).not.toHaveBeenCalled();
  });

  it("KAN-199: keeps form values and shows an error when saving fails", async () => {
    vi.mocked(saveBusinessPublicProfile).mockRejectedValue(
      new Error("offline"),
    );
    renderWithProviders(<BusinessProfilePage />, {
      initialPath: "/business/business-profile",
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessProfilePage();

    await page.replaceName("Nombre sin guardar");
    await page.clickSave();

    expect(
      await screen.findByText(testI18n.t("common:errors.unknown")),
    ).toBeInTheDocument();
    expect(await page.findNameInput()).toHaveValue("Nombre sin guardar");
  });
});
