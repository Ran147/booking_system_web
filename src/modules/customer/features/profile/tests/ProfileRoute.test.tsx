import { screen } from "@testing-library/react";
import { appRoutes } from "@/app/router/appRoutes";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import {
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
} from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import { fetchCustomerProfile } from "../api/fetchCustomerProfile";

vi.mock("../api/fetchCustomerProfile");

const PROFILE_PATH = "/barberia-centro/profile";

describe("customer profile route", () => {
  beforeEach(() => {
    vi.mocked(fetchCustomerProfile).mockReset();
  });

  it("KAN-169 AC-KAN-169-04: redirects a signed-out visitor to sign-in without loading profile data", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: PROFILE_PATH,
      session: SIGNED_OUT_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("signInPlaceholder.title"),
      }),
    ).toBeInTheDocument();
    expect(fetchCustomerProfile).not.toHaveBeenCalled();
  });

  it("KAN-169 AC-KAN-169-04: redirects another role without loading profile data", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: PROFILE_PATH,
      session: SUBSCRIBER_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("landing:placeholder.title"),
      }),
    ).toBeInTheDocument();
    expect(fetchCustomerProfile).not.toHaveBeenCalled();
  });
});
