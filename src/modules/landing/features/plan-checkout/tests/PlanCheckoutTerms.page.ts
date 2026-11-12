import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/test-utils";

export interface PlanCheckoutTermsPageObject {
  readonly acceptTerms: () => Promise<void>;
  readonly getEmailField: () => HTMLElement;
  readonly getPayButton: () => HTMLElement;
  readonly getTermsCheckbox: () => HTMLElement;
  readonly getTermsLink: () => HTMLElement;
  readonly openTerms: () => void;
  readonly typeEmail: (email: string) => Promise<void>;
}

export const createPlanCheckoutTermsPage = (): PlanCheckoutTermsPageObject => {
  const user = userEvent.setup();

  const getEmailField = (): HTMLElement =>
    screen.getByLabelText(
      new RegExp(
        `^${testI18n.t("landing:planCheckout.checkout.emailLabel")}\\*?$`,
      ),
    );
  const getTermsCheckbox = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.CHECKBOX);
  const getTermsLink = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.LINK, {
      name: testI18n.t("landing:planCheckout.checkout.termsLink"),
    });

  return {
    acceptTerms: async (): Promise<void> => {
      await user.click(getTermsCheckbox());
    },
    getEmailField,
    getPayButton: (): HTMLElement =>
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("landing:planCheckout.checkout.payAction"),
      }),
    getTermsCheckbox,
    getTermsLink,
    // A plain click: user-event also clicks the checkbox of the label that
    // holds the link, which a browser does not do for a link (HTML label
    // activation skips interactive content).
    openTerms: (): void => {
      fireEvent.click(getTermsLink());
    },
    typeEmail: async (email: string): Promise<void> => {
      await user.type(getEmailField(), email);
    },
  };
};
