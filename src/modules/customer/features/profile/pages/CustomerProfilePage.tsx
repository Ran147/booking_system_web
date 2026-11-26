import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  AppLink,
  Button,
  EmptyState,
  ErrorState,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE, VIEW_STATE } from "@/constants";
import { CustomerProfileDetails } from "../components/CustomerProfileDetails";
import { useCustomerProfileViewModel } from "../hooks/useCustomerProfileViewModel";

export const CustomerProfilePage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const {
    backPath,
    errorMessageKey,
    handleRetry,
    isFetching,
    profile,
    viewState,
  } = useCustomerProfileViewModel();

  return (
    <div className="mx-auto w-full min-w-0 max-w-xl [overflow-wrap:anywhere]">
      <PageTemplate
        description={t("profile.description")}
        title={t("profile.title")}
      >
        <AppLink className="self-start focus-visible:outline" to={backPath}>
          {t("profile.navigation.back")}
        </AppLink>
        {viewState === VIEW_STATE.LOADING && (
          <div>
            <Spinner />
            <p className="text-center text-muted-foreground">
              {t("profile.states.loading")}
            </p>
          </div>
        )}
        {viewState === VIEW_STATE.ERROR && (
          <div className="space-y-4">
            <ErrorState messageKey={errorMessageKey} />
            <Button isLoading={isFetching} onClick={handleRetry}>
              {t("profile.actions.retry")}
            </Button>
          </div>
        )}
        {viewState === VIEW_STATE.EMPTY && (
          <div aria-label={t("profile.states.notFound")} role="status">
            <EmptyState message={t("profile.states.notFound")} />
          </div>
        )}
        {profile && <CustomerProfileDetails profile={profile} />}
      </PageTemplate>
    </div>
  );
};
