import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ViewStateSwitch } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ProfileDetails } from "./components/ProfileDetails";
import { useProfileViewModel } from "./hooks/useProfileViewModel";

export const ProfilePage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { errorMessageKey, profile, retry, viewState } = useProfileViewModel();

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("profile.view.title")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("profile.view.description")}
        </p>
      </header>

      <ViewStateSwitch
        emptyMessage={t("profile.view.empty")}
        errorMessageKey={errorMessageKey}
        onRetry={retry}
        viewState={viewState}
      >
        {profile ? <ProfileDetails profile={profile} /> : null}
      </ViewStateSwitch>
    </div>
  );
};
