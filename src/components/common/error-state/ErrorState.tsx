import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/button";
import { ERROR_MESSAGE_KEY, type ErrorMessageKey } from "@/shared/constants";

export interface ErrorStateProps {
  messageKey?: ErrorMessageKey;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState = ({
  messageKey = ERROR_MESSAGE_KEY.UNKNOWN,
  onRetry,
  retryLabel,
}: ErrorStateProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div
      className="rounded-lg border border-destructive p-8 text-center text-destructive"
      role="alert"
    >
      <p>{t(messageKey)}</p>
      {onRetry && retryLabel ? (
        <Button className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
};
