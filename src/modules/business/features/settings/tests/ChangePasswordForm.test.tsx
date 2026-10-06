import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { toast } from "@/components";
import { FIREBASE_ERROR_CODE } from "@/constants";
import {
  COLLABORATOR_SESSION,
  SUBSCRIBER_SESSION,
  renderWithProviders,
  testI18n,
} from "@/test-utils";
import { createChangePasswordFormPage } from "./ChangePasswordForm.page";
import { SettingsPage } from "../SettingsPage";
import { changeCurrentUserPassword } from "../api/changeCurrentUserPassword";

vi.mock("../api/changeCurrentUserPassword");

const VALID_FORM_VALUES = {
  confirmPassword: "NewPassword1!",
  currentPassword: "CurrentPassword1!",
  newPassword: "NewPassword1!",
};

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(changeCurrentUserPassword).mockResolvedValue();
  });

  it("KAN-53: changes the authenticated subscriber password and clears the form", async () => {
    const successToast = vi.spyOn(toast, "success");
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createChangePasswordFormPage();
    await page.fillForm(VALID_FORM_VALUES);

    await page.clickSubmit();

    await waitFor(() =>
      expect(changeCurrentUserPassword).toHaveBeenCalledWith({
        currentPassword: VALID_FORM_VALUES.currentPassword,
        newPassword: VALID_FORM_VALUES.newPassword,
      }),
    );
    await waitFor(() => expect(page.getCurrentPasswordInput()).toHaveValue(""));
    expect(page.getNewPasswordInput()).toHaveValue("");
    expect(page.getConfirmPasswordInput()).toHaveValue("");
    expect(page.getCurrentPasswordInput()).toHaveAttribute("type", "password");
    expect(successToast).toHaveBeenCalledWith(
      testI18n.t("business:settings.password.successMessage"),
    );
  });

  it("KAN-53: reports an incorrect current password next to its field", async () => {
    vi.mocked(changeCurrentUserPassword).mockRejectedValue(
      new FirebaseError(FIREBASE_ERROR_CODE.INVALID_CREDENTIAL, "invalid"),
    );
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createChangePasswordFormPage();
    await page.fillForm(VALID_FORM_VALUES);

    await page.clickSubmit();

    expect(
      await screen.findByText(
        testI18n.t("business:settings.password.currentPasswordInvalid"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-53: rejects a weak password before calling Firebase", async () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createChangePasswordFormPage();
    await page.fillForm({
      confirmPassword: "weak",
      currentPassword: VALID_FORM_VALUES.currentPassword,
      newPassword: "weak",
    });

    await page.clickSubmit();

    expect(
      await screen.findByText(testI18n.t("validation:passwordTooWeak")),
    ).toBeInTheDocument();
    expect(changeCurrentUserPassword).not.toHaveBeenCalled();
  });

  it("KAN-53: rejects a non-matching confirmation", async () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createChangePasswordFormPage();
    await page.fillForm({
      ...VALID_FORM_VALUES,
      confirmPassword: "DifferentPassword1!",
    });

    await page.clickSubmit();

    expect(
      await screen.findByText(
        testI18n.t("business:settings.password.confirmationMismatch"),
      ),
    ).toBeInTheDocument();
    expect(changeCurrentUserPassword).not.toHaveBeenCalled();
  });

  it("KAN-53: reports too many Firebase attempts without exposing details", async () => {
    vi.mocked(changeCurrentUserPassword).mockRejectedValue(
      new FirebaseError(FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS, "technical"),
    );
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createChangePasswordFormPage();
    await page.fillForm(VALID_FORM_VALUES);

    await page.clickSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      testI18n.t("business:settings.password.tooManyAttempts"),
    );
    expect(alert).not.toHaveTextContent("technical");
  });

  it("KAN-53: preserves the form and reports a network failure", async () => {
    vi.mocked(changeCurrentUserPassword).mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
        "technical",
      ),
    );
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createChangePasswordFormPage();
    await page.fillForm(VALID_FORM_VALUES);

    await page.clickSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(testI18n.t("errors.network"));
    expect(alert).not.toHaveTextContent("technical");
    expect(page.getCurrentPasswordInput()).toHaveValue(
      VALID_FORM_VALUES.currentPassword,
    );
  });

  it("KAN-53: toggles each password field independently", async () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createChangePasswordFormPage();
    await page.toggleCurrentPasswordVisibility();

    expect(page.getCurrentPasswordInput()).toHaveAttribute("type", "text");
    expect(page.getNewPasswordInput()).toHaveAttribute("type", "password");
    expect(page.getConfirmPasswordInput()).toHaveAttribute("type", "password");
  });

  it("KAN-53: lets an active collaborator change only their own Auth password", async () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: COLLABORATOR_SESSION,
    });
    const page = createChangePasswordFormPage();
    await page.fillForm(VALID_FORM_VALUES);

    await page.clickSubmit();

    await waitFor(() =>
      expect(changeCurrentUserPassword).toHaveBeenCalledTimes(1),
    );
  });
});
