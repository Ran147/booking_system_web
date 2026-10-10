import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/shared/components";
import { ARIA_ROLE, I18N_NAMESPACE, ROUTE_PATH } from "@/shared/constants";
import type { SignUpSubmitError } from "../models/SubscriberSignUpFormViewModel.interface";

export interface SignUpSubmitAlertProps {
  readonly submitError: SignUpSubmitError;
}

// Why the server did not create the account. For an existing email it offers
// sign-in and password recovery without saying the email exists (AS-5).
export const SignUpSubmitAlert = ({
  submitError,
}: SignUpSubmitAlertProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-destructive p-4 text-sm text-destructive"
      role={ARIA_ROLE.ALERT}
    >
      <p>{submitError.message}</p>
      {submitError.showAccountLinks ? (
        <p className="flex flex-wrap gap-4">
          <AppLink to={ROUTE_PATH.AUTH.SIGN_IN}>
            {t("subscriberSignUp.form.signInAction")}
          </AppLink>
          <AppLink to={ROUTE_PATH.AUTH.PASSWORD_RECOVERY}>
            {t("subscriberSignUp.form.passwordRecoveryAction")}
          </AppLink>
        </p>
      ) : null}
    </div>
  );
};
