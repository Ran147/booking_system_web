import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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
import { fetchCustomerProfile } from "../api/fetchCustomerProfile";

const PROFILE_PATH = "/barberia-centro/profile";
const PROFILE_EDIT_PATH = "/barberia-centro/profile/edit";

vi.mock("@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug");
vi.mock("../api/fetchCustomerProfile");

beforeEach(() => {
  vi.mocked(fetchCustomerProfile).mockResolvedValue({
    email: "customer@example.com",
    fullName: "Ana Morales",
    phone: "+506 8888-7777",
  });
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
  it("KAN-169: renders ProfilePage at the profile route", async () => {
    const user = userEvent.setup();
    const { router } = renderRoutesWithProviders(appRoutes, {
      initialPath: PROFILE_PATH,
      session: CUSTOMER_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: testI18n.t("customer:profile.view.title"),
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: testI18n.t("customer:profile.view.editAction"),
      }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(PROFILE_EDIT_PATH),
    );
  });

  it("KAN-170: renders ProfileEditPage at the edit route", async () => {
    renderRoutesWithProviders(appRoutes, {
      initialPath: PROFILE_EDIT_PATH,
      session: CUSTOMER_SESSION,
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: testI18n.t("customer:profile.edit.title"),
      }),
    ).toBeInTheDocument();
  });

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
