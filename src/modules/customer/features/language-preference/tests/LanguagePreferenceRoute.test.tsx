import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { appRoutes } from "@/app/router/appRoutes";
import {
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/shared/test-utils";

const LANGUAGE_PREFERENCE_PATH = "/barberia/profile/language";

describe("language preference route (KAN-172)", () => {
  it("redirects a signed-out visitor to sign-in", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: LANGUAGE_PREFERENCE_PATH,
      session: SIGNED_OUT_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("signInPlaceholder.title"),
      }),
    ).toBeInTheDocument();
  });

  it("redirects a non-customer away from the customer setting", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: LANGUAGE_PREFERENCE_PATH,
      session: SUBSCRIBER_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("landing:placeholder.title"),
      }),
    ).toBeInTheDocument();
  });
});
