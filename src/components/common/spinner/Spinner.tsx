import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

export const Spinner = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div
      aria-label={t("status.loading")}
      className="flex justify-center p-6"
      role="status"
    >
      <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
};
