import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  CursorPagination,
  EmptyState,
  ErrorState,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE, VIEW_STATE } from "@/constants";
import {
  CollaboratorLimitDialog,
  CollaboratorListTable,
  CollaboratorListToolbar,
  CollaboratorStatusDialog,
} from "../components";
import { useCollaboratorListViewModel } from "../hooks";

export const CollaboratorListPage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const viewModel = useCollaboratorListViewModel();
  const {
    filters,
    handleClearFilters,
    handleCloseLimitDialog,
    handleCloseStatusDialog,
    handleConfirmStatusChange,
    handleNavigateToDetail,
    handleNavigateToEdit,
    handleNavigateToNew,
    handleNavigateToPermissions,
    handleNavigateToUpgrade,
    handleNextPageClick,
    handleOpenDeactivateDialog,
    handleOpenReactivateDialog,
    handlePreviousPageClick,
    handleResendEmail,
    handleRetry,
    handleSearchChange,
    handleStatusFilterChange,
    hasActiveFilters,
    hasNextPage,
    hasPreviousPage,
    isMutatingStatus,
    isReadOnly,
    isResendingCollaboratorId,
    items,
    limitDialog,
    pageNumber,
    statusDialog,
    totalCount,
    usage,
    viewState,
  } = viewModel;

  const actions = !isReadOnly ? (
    <Button onClick={handleNavigateToNew} type="button">
      {t("business:collaborators.list.addAction")}
    </Button>
  ) : undefined;

  return (
    <PageTemplate
      actions={actions}
      description={t("business:collaborators.list.description")}
      title={t("business:collaborators.list.title")}
    >
      <div className="flex flex-col gap-4">
        {isReadOnly && (
          <Alert variant={ALERT_VARIANT.WARNING}>
            {t("business:collaborators.list.readOnly")}
          </Alert>
        )}

        <CollaboratorListToolbar
          filters={filters}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          usage={usage}
        />

        {viewState === VIEW_STATE.LOADING && <Spinner />}

        {viewState === VIEW_STATE.ERROR && (
          <div className="flex flex-col items-center gap-3">
            <ErrorState />
            <Button
              onClick={handleRetry}
              type="button"
              variant={BUTTON_VARIANT.SECONDARY}
            >
              {t("business:collaborators.list.retryAction")}
            </Button>
          </div>
        )}

        {viewState === VIEW_STATE.EMPTY && (
          <div className="flex flex-col items-center gap-3">
            <EmptyState
              message={
                hasActiveFilters
                  ? t("business:collaborators.list.emptyFiltered")
                  : t("business:collaborators.list.empty")
              }
            />
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                type="button"
                variant={BUTTON_VARIANT.OUTLINE}
              >
                {t("business:collaborators.list.clearFiltersAction")}
              </Button>
            )}
          </div>
        )}

        {viewState === VIEW_STATE.READY && (
          <>
            <CollaboratorListTable
              isReadOnly={isReadOnly}
              isResendingCollaboratorId={isResendingCollaboratorId}
              items={items}
              onDeactivate={handleOpenDeactivateDialog}
              onEdit={handleNavigateToEdit}
              onPermissions={handleNavigateToPermissions}
              onReactivate={handleOpenReactivateDialog}
              onResendEmail={(collaborator): void => {
                void handleResendEmail(collaborator);
              }}
              onViewDetail={handleNavigateToDetail}
            />
            <CursorPagination
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onNextPageClick={handleNextPageClick}
              onPreviousPageClick={handlePreviousPageClick}
              pageNumber={pageNumber}
              totalCount={totalCount}
            />
          </>
        )}
      </div>

      <CollaboratorStatusDialog
        collaboratorName={statusDialog.collaborator?.fullName ?? ""}
        isLoading={isMutatingStatus}
        mode={statusDialog.mode}
        onClose={handleCloseStatusDialog}
        onConfirm={(): void => {
          void handleConfirmStatusChange();
        }}
        upcomingBookingsCount={statusDialog.upcomingBookingsCount}
      />

      <CollaboratorLimitDialog
        dialog={limitDialog}
        onClose={handleCloseLimitDialog}
        onUpgrade={handleNavigateToUpgrade}
      />
    </PageTemplate>
  );
};
