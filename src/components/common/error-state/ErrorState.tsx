import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ERROR_MESSAGE_KEY, type ErrorMessageKey } from "@/shared/constants";
import { Button } from "../button";

export interface ErrorStateProps {
  messageKey?: ErrorMessageKey;
  onRetry?: () => void;
}

export const ErrorState = ({
  messageKey = ERROR_MESSAGE_KEY.UNKNOWN,
  onRetry,
}: ErrorStateProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div
      className="rounded-lg border border-destructive p-8 text-center text-destructive"
      role="alert"
    >
      <p>{t(messageKey)}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry} variant="outline">
          {t("actions.retry")}
        </Button>
      ) : null}
    </div>
  );
};
