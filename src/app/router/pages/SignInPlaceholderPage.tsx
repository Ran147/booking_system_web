import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageTemplate } from "@/shared/components";

// Target of RequireRole's sign-in redirect until features/auth implements
// its spec (KAN-28, KAN-128).
export const SignInPlaceholderPage = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <main className="px-6 py-8">
      <PageTemplate
        description={t("signInPlaceholder.description")}
        title={t("signInPlaceholder.title")}
      />
    </main>
  );
};
