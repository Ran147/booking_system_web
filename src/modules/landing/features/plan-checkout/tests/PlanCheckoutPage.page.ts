import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/test-utils";
import type { NullableRef } from "@/types";

const FIELD_LABEL_KEY = {
  cardCvc: "landing:planCheckout.checkout.cardCvcLabel",
  cardExpiry: "landing:planCheckout.checkout.cardExpiryLabel",
  cardNumber: "landing:planCheckout.checkout.cardNumberLabel",
  cardholderName: "landing:planCheckout.checkout.cardholderNameLabel",
  email: "landing:planCheckout.checkout.emailLabel",
} as const;

const REGEXP_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (text: string): string =>
  text.replace(REGEXP_SPECIAL_CHARACTERS, "\\$&");

export type PlanCheckoutField = keyof typeof FIELD_LABEL_KEY;

export type PlanCheckoutValues = Record<PlanCheckoutField, string>;

export const VALID_CHECKOUT_VALUES: PlanCheckoutValues = {
  cardCvc: "123",
  cardExpiry: "12/40",
  cardNumber: "4000 0000 0000 0001",
  cardholderName: "Ana Pérez",
  email: "Duena@Negocio.com",
};

export interface PlanCheckoutPageObject {
  readonly acceptTerms: () => Promise<void>;
  readonly clickPay: () => Promise<void>;
  readonly fillAndPay: (values?: PlanCheckoutValues) => Promise<void>;
  readonly getField: (field: PlanCheckoutField) => HTMLInputElement;
  readonly getPayButton: () => HTMLElement;
  readonly getRecaptcha: () => HTMLElement;
  readonly getTermsCheckbox: () => HTMLElement;
  readonly queryPayButton: () => NullableRef<HTMLElement>;
  readonly solveRecaptcha: () => Promise<void>;
  readonly typeInto: (field: PlanCheckoutField, value: string) => Promise<void>;
}

export const createPlanCheckoutPage = (): PlanCheckoutPageObject => {
  const user = userEvent.setup();

  // Required labels end with a decorative "*", so the label text is matched
  // whole, with that optional mark.
  const getField = (field: PlanCheckoutField): HTMLInputElement =>
    screen.getByLabelText(
      new RegExp(`^${escapeRegExp(testI18n.t(FIELD_LABEL_KEY[field]))}\\*?$`),
    );
  // RecaptchaField is replaced by recaptchaFieldDouble in these tests.
  const getRecaptcha = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("landing:planCheckout.checkout.recaptchaLabel"),
    });
  const payButtonName = new RegExp(
    `^(${testI18n.t("landing:planCheckout.checkout.payAction")}|${testI18n.t("landing:planCheckout.checkout.paying")})$`,
  );
  const getPayButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, { name: payButtonName });
  const getTermsCheckbox = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.CHECKBOX);

  const typeInto = async (
    field: PlanCheckoutField,
    value: string,
  ): Promise<void> => {
    await user.type(getField(field), value);
  };
  const acceptTerms = async (): Promise<void> => {
    await user.click(getTermsCheckbox());
  };
  const solveRecaptcha = async (): Promise<void> => {
    await user.click(getRecaptcha());
  };
  const clickPay = async (): Promise<void> => {
    await user.click(getPayButton());
  };

  return {
    acceptTerms,
    clickPay,
    fillAndPay: async (
      values: PlanCheckoutValues = VALID_CHECKOUT_VALUES,
    ): Promise<void> => {
      for (const [field, value] of Object.entries(values)) {
        await typeInto(field as PlanCheckoutField, value);
      }
      await acceptTerms();
      await solveRecaptcha();
      await clickPay();
    },
    getField,
    getPayButton,
    getRecaptcha,
    getTermsCheckbox,
    queryPayButton: (): NullableRef<HTMLElement> =>
      screen.queryByRole(ARIA_ROLE.BUTTON, { name: payButtonName }),
    solveRecaptcha,
    typeInto,
  };
};
