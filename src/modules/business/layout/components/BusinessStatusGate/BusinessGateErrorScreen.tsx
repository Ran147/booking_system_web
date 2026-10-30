import { RotateCw } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, BUTTON_VARIANT } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { BusinessGateErrorScreenProps } from "@/modules/business/layout/models";

// AC-KAN-33-12: without the business no screen of the portal is rendered,
// only the message and a retry.
export const BusinessGateErrorScreen = ({
  message,
  onRetry,
}: BusinessGateErrorScreenProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Alert className="flex w-full max-w-lg flex-col items-start gap-3">
        <p>{message}</p>
        <Button
          leftIcon={RotateCw}
          onClick={onRetry}
          type="button"
          variant={BUTTON_VARIANT.OUTLINE}
        >
          {t("layout.statusGate.retryAction")}
        </Button>
      </Alert>
    </main>
  );
};
