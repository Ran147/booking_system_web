import { AlertCircle, AlertTriangle, Plus, RotateCw } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  CursorPagination,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE, VIEW_STATE } from "@/constants";
import { useServiceListViewModel } from "@/modules/business/features/services";
import { DeactivateServiceConfirmDialog } from "../DeactivateServiceConfirmDialog";
import { DeleteServiceConfirmDialog } from "../DeleteServiceConfirmDialog";
import { ServiceListEmptyState } from "../ServiceListEmptyState";
import { ServiceListNoResults } from "../ServiceListNoResults";
import { ServiceListTable } from "../ServiceListTable";
import { ServiceListToolbar } from "../ServiceListToolbar";
import type { ServiceListPageProps } from "./types/ServiceListPage.types";

export const ServiceListPage = ({
  businessStatus,
  currency,
  onCreateService,
  onEditService,
}: ServiceListPageProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const viewModel = useServiceListViewModel({
    businessStatus,
    currency,
    onCreateService,
    onEditService,
  });

  return (
    <PageTemplate
      actions={
        <Button
          ariaLabel={t("services.list.createServiceAction", {
            ns: I18N_NAMESPACE.BUSINESS,
          })}
          disabled={viewModel.isReadOnly}
          leftIcon={Plus}
          onClick={viewModel.handleCreateService}
          size={BUTTON_SIZE.MD}
          type="button"
          variant={BUTTON_VARIANT.DEFAULT}
        >
          {t("services.list.createServiceAction", {
            ns: I18N_NAMESPACE.BUSINESS,
          })}
        </Button>
      }
      description={t("services.list.description", {
        ns: I18N_NAMESPACE.BUSINESS,
      })}
      title={t("services.list.title", { ns: I18N_NAMESPACE.BUSINESS })}
    >
      {viewModel.isReadOnly && (
        <div
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {t("errors.readOnly", { ns: I18N_NAMESPACE.BUSINESS })}
            </p>
            <p className="text-xs opacity-90">
              {t("services.list.readOnlyNotice", {
                ns: I18N_NAMESPACE.BUSINESS,
              })}
            </p>
          </div>
        </div>
      )}

      <ServiceListToolbar
        hasActiveFilters={viewModel.hasActiveFilters}
        onClearFilters={viewModel.handleClearFilters}
        onSearchChange={viewModel.handleSearchChange}
        onStatusChange={viewModel.handleStatusChange}
        searchTerm={viewModel.filters.searchTerm}
        status={viewModel.filters.status}
      />

      {viewModel.viewState === VIEW_STATE.LOADING && (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      )}

      {viewModel.viewState === VIEW_STATE.ERROR && (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-10 text-center text-destructive"
          role="alert"
        >
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">
            {t("errors.network", { ns: I18N_NAMESPACE.COMMON })}
          </p>
          <Button
            ariaLabel={t("services.list.retryAction", {
              ns: I18N_NAMESPACE.BUSINESS,
            })}
            leftIcon={RotateCw}
            onClick={viewModel.handleRetry}
            size={BUTTON_SIZE.SM}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("services.list.retryAction", {
              ns: I18N_NAMESPACE.BUSINESS,
            })}
          </Button>
        </div>
      )}

      {viewModel.isEmpty && (
        <ServiceListEmptyState
          isReadOnly={viewModel.isReadOnly}
          onCreateService={viewModel.handleCreateService}
        />
      )}

      {viewModel.isNoResults && (
        <ServiceListNoResults onClearFilters={viewModel.handleClearFilters} />
      )}

      {viewModel.viewState === VIEW_STATE.READY &&
        !viewModel.isEmpty &&
        !viewModel.isNoResults && (
          <div className="space-y-4">
            <ServiceListTable
              currency={viewModel.currency}
              isActivating={viewModel.isActivating}
              isReadOnly={viewModel.isReadOnly}
              onActivateService={viewModel.handleActivateService}
              onEditService={viewModel.handleEditService}
              onOpenDeactivateModal={viewModel.handleOpenDeactivateModal}
              onOpenDeleteModal={viewModel.handleOpenDeleteModal}
              services={viewModel.services}
            />
            <CursorPagination
              hasNextPage={viewModel.hasNextPage}
              hasPreviousPage={viewModel.hasPreviousPage}
              onNextPageClick={viewModel.handleNextPage}
              onPreviousPageClick={viewModel.handlePreviousPage}
              pageNumber={viewModel.pageNumber}
              totalCount={viewModel.totalCount}
            />
          </div>
        )}

      <DeactivateServiceConfirmDialog
        isOpen={Boolean(viewModel.deactivatingService)}
        isPending={viewModel.isDeactivating}
        onCancel={viewModel.handleCloseDeactivateModal}
        onConfirm={viewModel.handleConfirmDeactivate}
        serviceName={viewModel.deactivatingService?.name ?? ""}
      />

      <DeleteServiceConfirmDialog
        isOpen={Boolean(viewModel.deletingService)}
        isPending={viewModel.isDeleting}
        onCancel={viewModel.handleCloseDeleteModal}
        onConfirm={viewModel.handleConfirmDelete}
        serviceName={viewModel.deletingService?.name ?? ""}
      />
    </PageTemplate>
  );
};
