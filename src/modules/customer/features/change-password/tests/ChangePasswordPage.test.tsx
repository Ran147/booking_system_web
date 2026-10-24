import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { FIREBASE_ERROR_CODE } from "@/constants";
import {
  CUSTOMER_SESSION,
  renderWithProviders,
  testI18n,
} from "@/shared/test-utils";
import type { NullableUndefined } from "@/types";
import { createChangePasswordPage } from "./ChangePasswordPage.page";
import { ChangePasswordPage } from "../ChangePasswordPage";
import * as changePasswordModule from "../api/changeCurrentUserPassword";

const CURRENT_PASSWORD = "Current1!";
const NEW_PASSWORD = "NewSecure2@";

const renderPage = (): ReturnType<typeof createChangePasswordPage> => {
  renderWithProviders(<ChangePasswordPage />, {
    initialPath: "/barberia/profile/password",
    session: CUSTOMER_SESSION,
  });
  return createChangePasswordPage();
};

describe("ChangePasswordPage (KAN-171)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("AC-KAN-171-01: changes the password and clears the form", async () => {
    const changePasswordSpy = vi
      .spyOn(changePasswordModule, "changeCurrentUserPassword")
      .mockResolvedValue();
    const successSpy = vi.spyOn(toast, "success");
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword(NEW_PASSWORD);
    await page.changeConfirmation(NEW_PASSWORD);
    await page.clickSave();

    await waitFor(() => expect(changePasswordSpy).toHaveBeenCalledOnce());
    expect(changePasswordSpy).toHaveBeenCalledWith({
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });
    expect(successSpy).toHaveBeenCalledWith(
      testI18n.t("customer:profile.password.changeSuccess"),
    );
    expect(page.getCurrentPasswordInput()).toHaveValue("");
    expect(page.getNewPasswordInput()).toHaveValue("");
    expect(page.getConfirmationInput()).toHaveValue("");
  });

  it("AC-KAN-171-02: shows an error for an incorrect current password", async () => {
    vi.spyOn(
      changePasswordModule,
      "changeCurrentUserPassword",
    ).mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.INVALID_CREDENTIAL,
        FIREBASE_ERROR_CODE.INVALID_CREDENTIAL,
      ),
    );
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword(NEW_PASSWORD);
    await page.changeConfirmation(NEW_PASSWORD);
    await page.clickSave();

    expect(
      await screen.findByText(
        testI18n.t("customer:profile.password.currentInvalidError"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-171-03: rejects a weak password without sending it", async () => {
    const changePasswordSpy = vi.spyOn(
      changePasswordModule,
      "changeCurrentUserPassword",
    );
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword("weak");
    await page.changeConfirmation("weak");
    await page.clickSave();

    expect(
      await screen.findByText(testI18n.t("validation:passwordTooWeak")),
    ).toBeInTheDocument();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-171-04: rejects a confirmation that does not match", async () => {
    const changePasswordSpy = vi.spyOn(
      changePasswordModule,
      "changeCurrentUserPassword",
    );
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword(NEW_PASSWORD);
    await page.changeConfirmation("Another3#");
    await page.clickSave();

    expect(
      await screen.findByText(
        testI18n.t("customer:profile.password.mismatchError"),
      ),
    ).toBeInTheDocument();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-171-05: shows a translated network error", async () => {
    vi.spyOn(
      changePasswordModule,
      "changeCurrentUserPassword",
    ).mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
        FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
      ),
    );
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword(NEW_PASSWORD);
    await page.changeConfirmation(NEW_PASSWORD);
    await page.clickSave();

    expect(
      await screen.findByText(testI18n.t("common:errors.network")),
    ).toBeInTheDocument();
  });

  it("AC-KAN-171-05: shows the too-many-attempts error", async () => {
    vi.spyOn(
      changePasswordModule,
      "changeCurrentUserPassword",
    ).mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS,
        FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS,
      ),
    );
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword(NEW_PASSWORD);
    await page.changeConfirmation(NEW_PASSWORD);
    await page.clickSave();

    expect(
      await screen.findByText(
        testI18n.t("customer:profile.password.tooManyAttemptsError"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-171-06: rejects a new password equal to the current password", async () => {
    const changePasswordSpy = vi.spyOn(
      changePasswordModule,
      "changeCurrentUserPassword",
    );
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword(CURRENT_PASSWORD);
    await page.changeConfirmation(CURRENT_PASSWORD);
    await page.clickSave();

    expect(
      await screen.findByText(
        testI18n.t("customer:profile.password.sameAsCurrentError"),
      ),
    ).toBeInTheDocument();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it("KAN-171: shows the session error when reauthentication is no longer valid", async () => {
    vi.spyOn(
      changePasswordModule,
      "changeCurrentUserPassword",
    ).mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.REQUIRES_RECENT_LOGIN,
        FIREBASE_ERROR_CODE.REQUIRES_RECENT_LOGIN,
      ),
    );
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword(NEW_PASSWORD);
    await page.changeConfirmation(NEW_PASSWORD);
    await page.clickSave();

    expect(
      await screen.findByText(
        testI18n.t("customer:profile.password.reauthenticationError"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-171-01: disables the action while the change is processing", async () => {
    let resolveChange: NullableUndefined<() => void>;
    vi.spyOn(
      changePasswordModule,
      "changeCurrentUserPassword",
    ).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveChange = resolve;
        }),
    );
    const page = renderPage();

    await page.changeCurrentPassword(CURRENT_PASSWORD);
    await page.changeNewPassword(NEW_PASSWORD);
    await page.changeConfirmation(NEW_PASSWORD);
    await page.clickSave();

    expect(
      screen.getByRole("button", {
        name: testI18n.t("customer:profile.password.saving"),
      }),
    ).toBeDisabled();
    resolveChange?.();
    await waitFor(() => expect(page.getCurrentPasswordInput()).toHaveValue(""));
  });

  it("AC-KAN-171-07: toggles password visibility without changing its value", async () => {
    const page = renderPage();
    await page.changeCurrentPassword(CURRENT_PASSWORD);

    expect(page.getCurrentPasswordInput()).toHaveAttribute("type", "password");
    await page.clickShowPassword();
    expect(page.getCurrentPasswordInput()).toHaveAttribute("type", "text");
    expect(page.getCurrentPasswordInput()).toHaveValue(CURRENT_PASSWORD);
  });
});
