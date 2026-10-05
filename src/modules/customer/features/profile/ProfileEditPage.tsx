import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ViewStateSwitch,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ProfileForm } from "./components";
import { useProfileFormViewModel } from "./hooks";

export const ProfileEditPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useProfileFormViewModel();

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          {t("profile.edit.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("profile.edit.description")}
        </p>
      </header>

      <ViewStateSwitch
        emptyMessage={t("profile.edit.empty")}
        viewState={viewModel.viewState}
      >
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("profile.edit.sectionTitle")}</CardTitle>
            <CardDescription>{t("profile.edit.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm viewModel={viewModel} />
          </CardContent>
        </Card>
      </ViewStateSwitch>
    </div>
  );
};
