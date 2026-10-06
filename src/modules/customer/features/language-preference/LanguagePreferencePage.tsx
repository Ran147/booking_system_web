import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { LanguageSelector } from "./components";
import { useLanguagePreferenceViewModel } from "./hooks";

export const LanguagePreferencePage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useLanguagePreferenceViewModel();

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          {t("profile.preferences.languageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("profile.preferences.languageDescription")}
        </p>
      </header>
      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{t("profile.preferences.languageSectionTitle")}</CardTitle>
          <CardDescription>
            {t("profile.preferences.languageHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewModel.isLoadingPreference ? (
            <Spinner />
          ) : (
            <LanguageSelector viewModel={viewModel} />
          )}
        </CardContent>
      </Card>
    </main>
  );
};
