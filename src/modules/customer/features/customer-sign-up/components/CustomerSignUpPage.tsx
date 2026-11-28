import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/common";
import { ARIA_ROLE, I18N_NAMESPACE } from "@/constants";
import { CustomerSignUpForm } from "./CustomerSignUpForm";
import { VERIFICATION_EMAIL_STATUS } from "../constants/CustomerSignUp.constants";
import { useCustomerSignUpViewModel } from "../hooks/useCustomerSignUpViewModel";

// /<businessSlug>/sign-up (KAN-123, Q4). After a successful sign-up the form
// gives way to the result; the move to sign-in arrives with KAN-127.
export const CustomerSignUpPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const customerSignUpViewModel = useCustomerSignUpViewModel();
  const { verificationEmail } = customerSignUpViewModel;

  const renderContent = (): ReactElement => {
    if (verificationEmail === VERIFICATION_EMAIL_STATUS.SENT) {
      return (
        <p className="text-foreground" role={ARIA_ROLE.STATUS}>
          {t("signUp.verification.sent")}
        </p>
      );
    }
    if (verificationEmail === VERIFICATION_EMAIL_STATUS.SEND_FAILED) {
      return <Alert>{t("signUp.verification.sendFailed")}</Alert>;
    }
    return (
      <CustomerSignUpForm customerSignUpViewModel={customerSignUpViewModel} />
    );
  };

  return (
    <div className="flex justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("signUp.title")}
          </h1>
          <CardDescription>{t("signUp.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
};
