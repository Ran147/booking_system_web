import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ERROR_MESSAGE_KEY, type ErrorMessageKey } from "@/shared/constants";

export interface ErrorStateProps {
  messageKey?: ErrorMessageKey;
}

export const ErrorState = ({
  messageKey = ERROR_MESSAGE_KEY.UNKNOWN,
}: ErrorStateProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div
      className="rounded-lg border border-destructive p-8 text-center text-destructive"
      role="alert"
    >
      <p>{t(messageKey)}</p>
    </div>
  );
};
