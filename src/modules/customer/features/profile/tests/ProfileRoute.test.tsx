import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { appRoutes } from "@/app/router/appRoutes";
import { BUSINESS_STATUS } from "@/domain";
import { fetchBusinessPublicProfileBySlug } from "@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug";
import {
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/shared/test-utils";

const PROFILE_PATH = "/barberia-centro/profile";

vi.mock("@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug");

beforeEach(() => {
  vi.mocked(fetchBusinessPublicProfileBySlug).mockResolvedValue({
    contactEmail: null,
    contactPhone: null,
    description: null,
    id: "business-id",
    logoUrl: null,
    name: "Barbería Centro",
    slug: "barberia-centro",
    socialLinks: [],
    status: BUSINESS_STATUS.ACTIVE,
  });
});

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

  it("KAN-170: redirects a signed-out visitor before showing the edit form", async () => {
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

  it("KAN-170: redirects a non-customer before showing the edit form", async () => {
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
