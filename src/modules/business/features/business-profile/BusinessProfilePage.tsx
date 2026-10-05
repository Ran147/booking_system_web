import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, ErrorState, Spinner } from "@/components";
import { I18N_NAMESPACE, VIEW_STATE } from "@/constants";
import { BusinessProfileForm } from "./components/BusinessProfileForm";
import { useBusinessProfilePageViewModel } from "./hooks/useBusinessProfilePageViewModel";

export const BusinessProfilePage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { profile, retry, viewState } = useBusinessProfilePageViewModel();

  if (viewState === VIEW_STATE.LOADING) return <Spinner />;

  if (viewState === VIEW_STATE.ERROR || !profile) {
    return (
      <div className="space-y-4">
        <ErrorState />
        <Button onClick={retry} variant="outline">
          {t("businessProfile.retryAction")}
        </Button>
      </div>
    );
  }

  return <BusinessProfileForm profile={profile} />;
};
