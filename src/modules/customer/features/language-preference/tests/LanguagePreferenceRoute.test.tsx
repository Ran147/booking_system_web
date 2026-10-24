import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "@/app/router/appRoutes";
import { BUSINESS_STATUS } from "@/domain";
import { fetchUserLanguage } from "@/modules/auth/api/fetchUserLanguage";
import { fetchCustomerProfile } from "@/modules/customer/features/profile";
import { fetchBusinessPublicProfileBySlug } from "@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug";
import {
  CUSTOMER_SESSION,
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/shared/test-utils";

const LANGUAGE_PREFERENCE_PATH = "/barberia/profile/language";

vi.mock("@/modules/auth/api/fetchUserLanguage");
vi.mock("@/modules/customer/features/profile/api/fetchCustomerProfile");
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
  vi.mocked(fetchCustomerProfile).mockResolvedValue({
    email: "customer@example.com",
    fullName: "Customer Example",
    phone: "+506 8888-8888",
  });
  vi.mocked(fetchUserLanguage).mockResolvedValue({ language: null });
});

describe("language preference route (KAN-172)", () => {
  it("lets a customer open the language preference", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: LANGUAGE_PREFERENCE_PATH,
      session: CUSTOMER_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: testI18n.t("customer:profile.preferences.languageTitle"),
      }),
    ).toBeInTheDocument();
  });

  it("redirects a signed-out visitor to sign-in", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: LANGUAGE_PREFERENCE_PATH,
      session: SIGNED_OUT_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        name: testI18n.t("auth.signIn.title"),
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
        level: 1,
        name: testI18n.t("business:home.title"),
      }),
    ).toBeInTheDocument();
  });

  it.each([
    ["KAN-169", "/barberia/profile", "customer:profile.view.title"],
    ["KAN-170", "/barberia/profile/edit", "customer:profile.edit.title"],
    [
      "KAN-171",
      "/barberia/profile/password",
      "customer:profile.password.title",
    ],
  ] as const)("keeps the %s route accessible", async (_kan, path, titleKey) => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: path,
      session: CUSTOMER_SESSION,
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: testI18n.t(titleKey),
        }),
      ).toBeInTheDocument(),
    );
  });
});
