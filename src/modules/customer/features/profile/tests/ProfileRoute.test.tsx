import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { appRoutes } from "@/app/router/appRoutes";
import {
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/shared/test-utils";

const PROFILE_PATH = "/barberia-centro/profile";

describe("customer profile route (KAN-170)", () => {
  it("redirects a signed-out visitor to sign-in", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: PROFILE_PATH,
      session: SIGNED_OUT_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("signInPlaceholder.title"),
      }),
    ).toBeInTheDocument();
  });

  it("redirects a non-customer away from the customer profile", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: PROFILE_PATH,
      session: SUBSCRIBER_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("landing:placeholder.title"),
      }),
    ).toBeInTheDocument();
  });
});
