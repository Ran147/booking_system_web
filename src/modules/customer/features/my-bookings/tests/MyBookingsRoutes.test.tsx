import { waitFor } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { BUSINESS_STATUS } from "@/domain";
import { customerRoutes } from "@/modules/customer";
import { fetchBusinessPublicProfileBySlug } from "@/modules/customer/layout/api/fetchBusinessPublicProfileBySlug";
import {
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
} from "@/shared/test-utils";
import * as fetchMyBookingsPageModule from "../api/fetchMyBookingsPage";

const MY_BOOKINGS_PATH = "/barberia-centro/my-bookings";
const SIGN_IN_PATH = "/sign-in";
const BUSINESS_PATH = "/business";
const ADMIN_PATH = "/admin";

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

// Static portals rank above the /:businessSlug segment (Q4).
const routes: RouteObject[] = [
  ...customerRoutes,
  { element: <p>sign in</p>, path: SIGN_IN_PATH },
  { element: <p>business portal</p>, path: BUSINESS_PATH },
  { element: <p>admin portal</p>, path: ADMIN_PATH },
];

describe("My bookings route guard (KAN-151)", () => {
  it.each([
    ["a visitor", SIGNED_OUT_SESSION, SIGN_IN_PATH],
    ["a subscriber", SUBSCRIBER_SESSION, BUSINESS_PATH],
    ["a super admin", SUPER_ADMIN_SESSION, ADMIN_PATH],
  ])(
    "AC-KAN-151-06: sends %s away without requesting bookings",
    async (_role, session, expectedPath) => {
      const fetchSpy = vi.spyOn(
        fetchMyBookingsPageModule,
        "fetchMyBookingsPage",
      );

      const { router } = renderRoutesWithProviders(routes, {
        initialPath: MY_BOOKINGS_PATH,
        session,
      });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe(expectedPath);
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );
});
