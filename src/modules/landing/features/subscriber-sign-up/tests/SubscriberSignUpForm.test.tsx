import { render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { RESERVED_BUSINESS_SLUG } from "@/shared/domain";
import { testI18n } from "@/shared/test-utils";
import { createSubscriberSignUpFormPage } from "./SubscriberSignUpForm.page";
import { SubscriberSignUpForm } from "../components/SubscriberSignUpForm";
import type { SubscriberSignUpFormValues } from "../models/SubscriberSignUpForm.schema";

const CHECKOUT_EMAIL = "duena@negocio.com";
const STRONG_PASSWORD = "Reserva!2026";

const renderSignUpForm = (
  onSubmit: (formValues: SubscriberSignUpFormValues) => Promise<void> = vi
    .fn()
    .mockResolvedValue(undefined),
): void => {
  render(
    <I18nextProvider i18n={testI18n}>
      <SubscriberSignUpForm
        checkoutEmail={CHECKOUT_EMAIL}
        onSubmit={onSubmit}
      />
    </I18nextProvider>,
  );
};

const fillValidForm = async (
  signUpPage: ReturnType<typeof createSubscriberSignUpFormPage>,
): Promise<void> => {
  await signUpPage.typeInto("firstName", "Ana");
  await signUpPage.typeInto("lastName", "Pérez");
  await signUpPage.typeInto("password", STRONG_PASSWORD);
  await signUpPage.typeInto("passwordConfirmation", STRONG_PASSWORD);
  await signUpPage.typeInto("businessName", "Barbería Centro");
};

describe("SubscriberSignUpForm (KAN-25)", () => {
  it("KAN-25: AC-KAN-25-01 submits the personal, account and business data", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    renderSignUpForm(handleSubmit);
    const signUpPage = createSubscriberSignUpFormPage();

    await fillValidForm(signUpPage);
    await signUpPage.clickSubmit();

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
    expect(handleSubmit.mock.calls[0]?.[0]).toEqual({
      businessName: "Barbería Centro",
      businessSlug: "barberia-centro",
      email: CHECKOUT_EMAIL,
      firstName: "Ana",
      lastName: "Pérez",
      password: STRONG_PASSWORD,
      passwordConfirmation: STRONG_PASSWORD,
      phone: "",
    });
  });

  it("KAN-25: AC-KAN-25-02 updates the strength level while typing", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("password", "reserva");
    expect(signUpPage.getStrengthStatus()).toHaveTextContent(
      testI18n.t("common:passwordStrength.level.weak"),
    );

    await signUpPage.typeInto("password", "!2026A");
    expect(signUpPage.getStrengthStatus()).toHaveTextContent(
      testI18n.t("common:passwordStrength.level.strong"),
    );
  });

  it("KAN-25: AC-KAN-25-03 shows the password without losing what was typed", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await signUpPage.typeInto("password", STRONG_PASSWORD);

    await signUpPage.clickShowPassword();

    expect(signUpPage.getField("password")).toHaveAttribute("type", "text");
    expect(signUpPage.getField("password")).toHaveValue(STRONG_PASSWORD);
  });

  it("KAN-25: AC-KAN-25-04 marks empty required fields and does not submit", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    renderSignUpForm(handleSubmit);
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.clickSubmit();

    expect(
      await screen.findAllByText(testI18n.t("validation:required")),
    ).not.toHaveLength(0);
    expect(signUpPage.getField("firstName")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("KAN-25: AC-KAN-25-06 rejects a weak password", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("password", "reserva2026");
    await signUpPage.blurField("password");

    expect(
      await screen.findByText(testI18n.t("validation:passwordTooWeak")),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-07 warns when the confirmation does not match", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    renderSignUpForm(handleSubmit);
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);
    await signUpPage.clearAndType("passwordConfirmation", "Reserva!2027");

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.passwordMismatch"),
      ),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("KAN-25: AC-KAN-25-11 rejects a name that is too short", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("firstName", "A");
    await signUpPage.blurField("firstName");

    expect(
      await screen.findByText(testI18n.t("validation:tooShort")),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-13 disables submit while the sign-up is pending", async () => {
    let resolveSubmit: () => void = () => undefined;
    const handleSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    renderSignUpForm(handleSubmit);
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    await waitFor(() => {
      expect(signUpPage.getSubmitButton()).toBeDisabled();
    });
    await signUpPage.clickSubmit();
    expect(handleSubmit).toHaveBeenCalledTimes(1);

    resolveSubmit();
    await waitFor(() => {
      expect(signUpPage.getSubmitButton()).toBeEnabled();
    });
  });

  it("KAN-25: AC-KAN-25-14 shows the checkout email read-only", () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    expect(signUpPage.getField("email")).toHaveValue(CHECKOUT_EMAIL);
    expect(signUpPage.getField("email")).toHaveAttribute("readonly");
  });

  it("KAN-25: AC-KAN-25-15 suggests the slug from the business name and shows the address", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("businessName", "Peluquería Doña Ana");

    expect(signUpPage.getField("businessSlug")).toHaveValue(
      "peluqueria-dona-ana",
    );
    expect(
      screen.getByText(
        testI18n.t("landing:subscriberSignUp.form.businessSlugHint", {
          businessAddress: "/peluqueria-dona-ana",
        }),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-15 keeps a slug the visitor edited", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await signUpPage.typeInto("businessName", "Barbería");
    await signUpPage.clearAndType("businessSlug", "mi-barberia");

    await signUpPage.typeInto("businessName", " Centro");

    expect(signUpPage.getField("businessSlug")).toHaveValue("mi-barberia");
  });

  it("KAN-25: AC-KAN-25-17 rejects a reserved slug", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("businessSlug", RESERVED_BUSINESS_SLUG.ADMIN);
    await signUpPage.blurField("businessSlug");

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.slugReservedError"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-19 rejects a slug with invalid characters", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("businessSlug", "mi_barberia");
    await signUpPage.blurField("businessSlug");

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.slugInvalidError"),
      ),
    ).toBeInTheDocument();
  });
});
