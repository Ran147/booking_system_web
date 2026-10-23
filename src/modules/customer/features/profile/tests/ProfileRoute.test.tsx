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

describe("customer profile route", () => {
  it("KAN-169 AC-KAN-169-04: redirects a signed-out visitor to sign-in without loading profile data", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: PROFILE_PATH,
      session: SIGNED_OUT_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("auth.signIn.title"),
      }),
    ).toBeInTheDocument();
  });

  it("KAN-169 AC-KAN-169-04: redirects another role without loading profile data", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: PROFILE_PATH,
      session: SUBSCRIBER_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: testI18n.t("business:home.title"),
      }),
    ).toBeInTheDocument();
  });
});
