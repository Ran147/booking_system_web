import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callFunction } from "@/services/firebase";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import { createContactFormPage } from "./ContactForm.page";
import { ContactForm } from "../components/ContactForm";

vi.mock("@/services/firebase/callFunction", () => ({
  callFunction: vi.fn(),
}));

vi.mock("@/components/common/recaptcha-field", async () => ({
  RecaptchaField: (await import("./recaptchaFieldDouble")).RecaptchaFieldDouble,
}));

const renderContactForm = (): void => {
  renderWithProviders(<ContactForm />, {
    initialPath: ROUTE_PATH.LANDING.CONTACT,
    session: SIGNED_OUT_SESSION,
  });
};

describe("ContactForm (US-05 / KAN-5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(callFunction).mockResolvedValue({ valid: true });
  });

  it("KAN-5: AC-KAN-5-01 submits contact message and displays success feedback with reset fields", async () => {
    renderContactForm();
    const page = createContactFormPage();

    await page.typeInto("name", "Laura Gomez");
    await page.typeInto("email", "laura@example.com");
    await page.typeInto("subject", "Demostración de software");
    await page.typeInto(
      "message",
      "Quisiera agendar una reunión para conocer la plataforma a fondo.",
    );
    await page.clickRecaptcha();

    expect(page.getSubmitButton()).toBeEnabled();
    await page.clickSubmit();

    await waitFor(() => {
      expect(page.querySuccessAlert()).toBeInTheDocument();
    });

    expect(page.getNameInput()).toHaveValue("");
    expect(page.getEmailInput()).toHaveValue("");
    expect(page.getSubjectInput()).toHaveValue("");
    expect(page.getMessageInput()).toHaveValue("");
    expect(callFunction).toHaveBeenCalledWith("sendContactMessage", {
      email: "laura@example.com",
      message:
        "Quisiera agendar una reunión para conocer la plataforma a fondo.",
      name: "Laura Gomez",
      recaptchaToken: "recaptcha-token",
      subject: "Demostración de software",
    });
  });

  it("KAN-5: AC-KAN-5-02 validates required fields and email format before submission", async () => {
    renderContactForm();
    const page = createContactFormPage();

    await page.clickRecaptcha();
    await page.typeInto("email", "invalid-email");
    await page.clickSubmit();

    await waitFor(() => {
      expect(
        page.queryAllFieldErrors(testI18n.t("validation:required")).length,
      ).toBeGreaterThan(0);
      expect(
        page.queryFieldError(testI18n.t("validation:emailInvalid")),
      ).toBeInTheDocument();
    });

    expect(callFunction).not.toHaveBeenCalled();
  });

  it("KAN-5: AC-KAN-5-03 keeps submit button disabled until reCAPTCHA is solved", async () => {
    renderContactForm();
    const page = createContactFormPage();

    await page.typeInto("name", "Carlos Ruiz");
    await page.typeInto("email", "carlos@example.com");
    await page.typeInto("subject", "Consulta general");
    await page.typeInto(
      "message",
      "Deseo consultar sobre los métodos de pago disponibles.",
    );

    expect(page.getSubmitButton()).toBeDisabled();
    expect(callFunction).not.toHaveBeenCalled();
  });

  it("KAN-5: AC-KAN-5-04 displays accessible server error and preserves entered values on failure", async () => {
    vi.mocked(callFunction).mockRejectedValueOnce(new Error("Network error"));

    renderContactForm();
    const page = createContactFormPage();

    await page.typeInto("name", "Elena Torres");
    await page.typeInto("email", "elena@example.com");
    await page.typeInto("subject", "Soporte técnico");
    await page.typeInto(
      "message",
      "No puedo visualizar mi agenda desde el panel móvil.",
    );
    await page.clickRecaptcha();
    await page.clickSubmit();

    await waitFor(() => {
      expect(page.queryServerErrorAlert()).toBeInTheDocument();
    });

    expect(page.getNameInput()).toHaveValue("Elena Torres");
    expect(page.getEmailInput()).toHaveValue("elena@example.com");
    expect(page.getSubjectInput()).toHaveValue("Soporte técnico");
    expect(page.getMessageInput()).toHaveValue(
      "No puedo visualizar mi agenda desde el panel móvil.",
    );
  });

  it("KAN-5: AC-KAN-5-05 implements semantic styling and accessible form attributes", () => {
    renderContactForm();
    const page = createContactFormPage();

    const form = page.getForm();
    expect(form).toHaveClass("bg-card");
    expect(form).toHaveClass("border-border");
    expect(form).toHaveAttribute("noValidate");

    const nameInput = page.getNameInput();
    expect(nameInput).toHaveAttribute("required");
    expect(nameInput).toHaveAttribute("id", "contact-name");

    const emailInput = page.getEmailInput();
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("required");
  });
});
