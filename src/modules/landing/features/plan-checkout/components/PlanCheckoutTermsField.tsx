import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink, CheckboxField } from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import type { NullableUndefined } from "@/types";
import { TERMS_LINK } from "../constants/PlanCheckout.constants";
import type { PlanCheckoutTermsFieldProps } from "../models/PlanCheckoutTermsFieldProps.interface";

// The terms of KAN-9 open in another tab, so the form keeps its values
// (AC-KAN-23-01). The checkbox waits until they were opened once (AS-11).
export const PlanCheckoutTermsField = ({
  field,
  hasOpenedTerms,
  isTermsAccepted,
  onTermsOpened,
}: PlanCheckoutTermsFieldProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  const readHelperText = (): NullableUndefined<string> => {
    if (!hasOpenedTerms) return t("planCheckout.terms.openFirst");
    return isTermsAccepted
      ? undefined
      : t("planCheckout.checkout.termsRequired");
  };

  return (
    <CheckboxField
      {...field}
      disabled={!hasOpenedTerms}
      helperText={readHelperText()}
      id="checkout-terms"
      label={
        <span>
          {t("planCheckout.checkout.termsAcceptance")}{" "}
          <AppLink
            className="font-medium underline hover:text-primary"
            onClick={onTermsOpened}
            rel={TERMS_LINK.RELATION}
            target={TERMS_LINK.TARGET}
            to={ROUTE_PATH.LANDING.TERMS}
          >
            {t("planCheckout.checkout.termsLink")}
          </AppLink>
        </span>
      }
      required
    />
  );
};
