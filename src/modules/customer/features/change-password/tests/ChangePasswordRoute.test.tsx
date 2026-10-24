import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "@/app/router/appRoutes";
import { BUSINESS_STATUS } from "@/domain";
import { fetchBusinessPublicProfileBySlug } from "@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug";
import {
  CUSTOMER_SESSION,
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/shared/test-utils";

const CHANGE_PASSWORD_PATH = "/barberia/profile/password";

vi.mock("@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug");

beforeEach(() => {
  vi.mocked(fetchBusinessPublicProfileBySlug).mockResolvedValue({
    contactEmail: null,
    contactPhone: null,
    description: null,
    id: "business-id",
    logoUrl: null,
    name: "Barbería",
    slug: "barberia",
    socialLinks: [],
    status: BUSINESS_STATUS.ACTIVE,
  });
});

describe("change password route (KAN-171)", () => {
  it("AC-KAN-171-01: lets a customer open the password page inside the customer layout", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: CHANGE_PASSWORD_PATH,
      session: CUSTOMER_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: testI18n.t("customer:profile.password.title"),
      }),
    ).toBeInTheDocument();
    expect(fetchBusinessPublicProfileBySlug).toHaveBeenCalledWith("barberia");
  });

  it("KAN-171: redirects a signed-out visitor to sign-in", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: CHANGE_PASSWORD_PATH,
      session: SIGNED_OUT_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("auth.signIn.title"),
      }),
    ).toBeInTheDocument();
  });

  it("KAN-171: redirects a non-customer away from the protected route", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: CHANGE_PASSWORD_PATH,
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
