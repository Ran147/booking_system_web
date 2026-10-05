import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { appRoutes } from "@/app/router/appRoutes";
import {
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/shared/test-utils";

const CHANGE_PASSWORD_PATH = "/barberia/profile/password";

describe("change password route (KAN-171)", () => {
  it("redirects a signed-out visitor to sign-in", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: CHANGE_PASSWORD_PATH,
      session: SIGNED_OUT_SESSION,
    });

    expect(
      await screen.findByRole(
        "heading",
        {
          name: testI18n.t("signInPlaceholder.title"),
        },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it("redirects a non-customer away from the protected route", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: CHANGE_PASSWORD_PATH,
      session: SUBSCRIBER_SESSION,
    });

    expect(
      await screen.findByRole(
        "heading",
        {
          name: testI18n.t("landing:placeholder.title"),
        },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });
});
