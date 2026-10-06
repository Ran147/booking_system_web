import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { I18N_NAMESPACE } from "@/shared/constants";
import { LandingFooter } from "./components/LandingFooter";

export const LandingLayout = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Temporary minimal header placeholder until navbar is built */}
      <header className="border-b border-border px-6 py-4">
        <p className="text-lg font-semibold">{t("layout.title")}</p>
      </header>
      <main className="flex-1 px-6 py-8">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
};
