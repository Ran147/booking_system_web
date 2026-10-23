import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
  ViewStateSwitch,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ProfileForm } from "./components";
import { useProfileFormViewModel } from "./hooks";

export const ProfileEditPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useProfileFormViewModel();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <PageTemplate
        description={t("profile.edit.description")}
        title={t("profile.edit.title")}
      >
        <ViewStateSwitch
          emptyMessage={t("profile.edit.empty")}
          errorMessageKey={viewModel.errorMessageKey}
          onRetry={() => void viewModel.retry()}
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
      </PageTemplate>
    </div>
  );
};
