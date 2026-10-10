import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { renderWithProviders, SUBSCRIBER_SESSION } from "@/shared/test-utils";
import { NotificationSettingsPage } from "../NotificationSettingsPage";
import * as api from "../api/alertSettingsApi";
import { alertSettingsDocumentSchema } from "../models/AlertSettings.schema";

describe("NotificationSettingsPage (KAN-101)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("defaults an absent map and individual keys to enabled", () => {
    expect(alertSettingsDocumentSchema.parse({}).alertSettings).toEqual({
      bookingCancelledByCustomer: true,
      bookingCreated: true,
      subscriptionEnding: true,
    });
    expect(
      alertSettingsDocumentSchema.parse({
        alertSettings: { bookingCreated: false },
      }).alertSettings,
    ).toEqual({
      bookingCancelledByCustomer: true,
      bookingCreated: false,
      subscriptionEnding: true,
    });
  });

  it("shows and persists each preference using the session business", async () => {
    vi.spyOn(api, "fetchAlertSettings").mockResolvedValue(
      alertSettingsDocumentSchema.parse({ status: BUSINESS_STATUS.ACTIVE }),
    );
    const updateSpy = vi.spyOn(api, "updateAlertSettings").mockResolvedValue();
    renderWithProviders(<NotificationSettingsPage />, {
      initialPath: "/business/notification-settings",
      session: SUBSCRIBER_SESSION,
    });
    for (const label of [
      "Nueva reserva",
      "Cancelación de reserva por cliente",
      "Suscripción próxima a vencer",
    ]) {
      const control = await screen.findByRole("switch", { name: label });
      expect(control).toBeChecked();
      await userEvent.click(control);
      await waitFor(() => expect(updateSpy).toHaveBeenCalled());
    }
    expect(
      updateSpy.mock.calls.every(
        ([id]) => id === SUBSCRIBER_SESSION.businessId,
      ),
    ).toBe(true);
  });

  it("rolls back an optimistic change when persistence fails", async () => {
    vi.spyOn(api, "fetchAlertSettings").mockResolvedValue(
      alertSettingsDocumentSchema.parse({ status: BUSINESS_STATUS.ACTIVE }),
    );
    vi.spyOn(api, "updateAlertSettings").mockRejectedValue(
      new FirebaseError(FIREBASE_ERROR_CODE.UNAVAILABLE, "offline"),
    );
    renderWithProviders(<NotificationSettingsPage />, {
      initialPath: "/business/notification-settings",
      session: SUBSCRIBER_SESSION,
    });
    const control = await screen.findByRole("switch", {
      name: "Nueva reserva",
    });
    await userEvent.click(control);
    await waitFor(() => expect(control).toBeChecked());
  });

  it.each([BUSINESS_STATUS.INACTIVE, BUSINESS_STATUS.SUSPENDED])(
    "keeps a %s business read-only",
    async (status) => {
      vi.spyOn(api, "fetchAlertSettings").mockResolvedValue(
        alertSettingsDocumentSchema.parse({ status }),
      );
      const updateSpy = vi.spyOn(api, "updateAlertSettings");
      renderWithProviders(<NotificationSettingsPage />, {
        initialPath: "/business/notification-settings",
        session: SUBSCRIBER_SESSION,
      });
      expect(
        await screen.findByRole("switch", { name: "Nueva reserva" }),
      ).toBeDisabled();
      expect(updateSpy).not.toHaveBeenCalled();
    },
  );
});
