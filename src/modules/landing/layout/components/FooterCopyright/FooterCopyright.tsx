import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { FooterCopyrightProps } from "./types";

export const FooterCopyright = ({
  currentYear,
}: FooterCopyrightProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <div className="mt-12 border-t border-border pt-8 text-center text-xs text-muted-foreground sm:flex sm:items-center sm:justify-between sm:text-left">
      <p>{t("footer.copyright", { year: currentYear })}</p>
    </div>
  );
};
