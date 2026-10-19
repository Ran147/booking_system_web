import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { renderWithProviders, SUBSCRIBER_SESSION } from "@/shared/test-utils";
import { ReminderSettingsPage } from "../ReminderSettingsPage";
import * as api from "../api/reminderSettingsApi";
import {
  reminderSettingsDocumentSchema,
  reminderSettingsSchema,
} from "../models/ReminderSettings.schema";

const ACTIVE_DOCUMENT = reminderSettingsDocumentSchema.parse({
  status: BUSINESS_STATUS.ACTIVE,
  timeZone: "America/Costa_Rica",
});

describe("ReminderSettingsPage (KAN-100)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("normalizes an absent map and absent individual keys", () => {
    expect(ACTIVE_DOCUMENT.reminderSettings).toEqual({
      isEnabled: true,
      leadTimesMinutes: [1440],
    });
    expect(
      reminderSettingsDocumentSchema.parse({
        reminderSettings: { isEnabled: false },
        timeZone: "UTC",
      }).reminderSettings,
    ).toEqual({ isEnabled: false, leadTimesMinutes: [1440] });
  });

  it("rejects invalid, duplicate, empty enabled, and excessive lead times", () => {
    expect(
      reminderSettingsSchema.safeParse({
        isEnabled: true,
        leadTimesMinutes: [],
      }).success,
    ).toBe(false);
    expect(
      reminderSettingsSchema.safeParse({
        isEnabled: true,
        leadTimesMinutes: [60, 60],
      }).success,
    ).toBe(false);
    expect(
      reminderSettingsSchema.safeParse({
        isEnabled: true,
        leadTimesMinutes: [60, 120, 720],
      }).success,
    ).toBe(false);
    expect(
      reminderSettingsSchema.safeParse({
        isEnabled: true,
        leadTimesMinutes: [30],
      }).success,
    ).toBe(false);
  });

  it("shows current values and saves two selections using the session business", async () => {
    vi.spyOn(api, "fetchReminderSettings").mockResolvedValue(ACTIVE_DOCUMENT);
    const saveSpy = vi.spyOn(api, "saveReminderSettings").mockResolvedValue();
    const successSpy = vi.spyOn(toast, "success");
    renderWithProviders(<ReminderSettingsPage />, {
      initialPath: "/business/notification-settings/reminders",
      session: SUBSCRIBER_SESSION,
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "24 horas antes" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "1 hora antes" }));
    await userEvent.click(
      screen.getByRole("button", { name: "2 horas antes" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() =>
      expect(saveSpy).toHaveBeenCalledWith(SUBSCRIBER_SESSION.businessId, {
        isEnabled: true,
        leadTimesMinutes: [60, 120],
      }),
    );
    expect(successSpy).toHaveBeenCalledWith(
      "Configuración de recordatorios guardada.",
    );
  });

  it("rejects a third selection", async () => {
    vi.spyOn(api, "fetchReminderSettings").mockResolvedValue({
      ...ACTIVE_DOCUMENT,
      reminderSettings: { isEnabled: true, leadTimesMinutes: [60, 120] },
    });
    renderWithProviders(<ReminderSettingsPage />, {
      initialPath: "/business/notification-settings/reminders",
      session: SUBSCRIBER_SESSION,
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "12 horas antes" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Puedes seleccionar como máximo dos anticipaciones.",
    );
  });

  it("keeps edited values after a failed save", async () => {
    vi.spyOn(api, "fetchReminderSettings").mockResolvedValue(ACTIVE_DOCUMENT);
    vi.spyOn(api, "saveReminderSettings").mockRejectedValue(
      new FirebaseError(FIREBASE_ERROR_CODE.UNAVAILABLE, "offline"),
    );
    renderWithProviders(<ReminderSettingsPage />, {
      initialPath: "/business/notification-settings/reminders",
      session: SUBSCRIBER_SESSION,
    });
    const option = await screen.findByRole("button", { name: "1 hora antes" });
    await userEvent.click(option);
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(option).toHaveAttribute("aria-pressed", "true");
  });

  it.each([BUSINESS_STATUS.INACTIVE, BUSINESS_STATUS.SUSPENDED])(
    "is read-only for a %s business",
    async (status) => {
      vi.spyOn(api, "fetchReminderSettings").mockResolvedValue({
        ...ACTIVE_DOCUMENT,
        status,
      });
      const saveSpy = vi.spyOn(api, "saveReminderSettings");
      renderWithProviders(<ReminderSettingsPage />, {
        initialPath: "/business/notification-settings/reminders",
        session: SUBSCRIBER_SESSION,
      });
      expect(await screen.findByRole("switch")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
      expect(saveSpy).not.toHaveBeenCalled();
    },
  );
});
