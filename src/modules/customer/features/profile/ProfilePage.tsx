import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageTemplate, ViewStateSwitch } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ProfileDetails } from "./components/ProfileDetails";
import { useProfileViewModel } from "./hooks/useProfileViewModel";

export const ProfilePage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { errorMessageKey, profile, retry, viewState } = useProfileViewModel();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <PageTemplate
        description={t("profile.view.description")}
        title={t("profile.view.title")}
      >
        <ViewStateSwitch
          emptyMessage={t("profile.view.empty")}
          errorMessageKey={errorMessageKey}
          onRetry={retry}
          viewState={viewState}
        >
          {profile ? <ProfileDetails profile={profile} /> : null}
        </ViewStateSwitch>
      </PageTemplate>
    </div>
  );
};
