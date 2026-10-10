import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppLink } from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import type { Nullable } from "@/types";
import type { SignInErrorAlertProps } from "../models/signIn.model";

export const SignInErrorAlert = ({
  alertReference,
  errorKey,
  shouldShowPasswordRecoveryLink,
}: SignInErrorAlertProps): Nullable<ReactElement> => {
  const { t } = useTranslation([
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);

  if (!errorKey) return null;

  return (
    <Alert className="flex flex-col gap-1" ref={alertReference}>
      <p>{t(errorKey)}</p>
      {shouldShowPasswordRecoveryLink && (
        <AppLink to={ROUTE_PATH.AUTH.PASSWORD_RECOVERY}>
          {t("auth.signIn.recoverPasswordAction")}
        </AppLink>
      )}
    </Alert>
  );
};
