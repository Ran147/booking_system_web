import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  PageTemplate,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  CollaboratorInvitationLinkDialog,
  CollaboratorLimitDialog,
  CollaboratorListContent,
  CollaboratorListToolbar,
  CollaboratorStatusDialog,
} from "../components";
import { useCollaboratorListViewModel } from "../hooks";

export const CollaboratorListPage = (): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);
  const viewModel = useCollaboratorListViewModel();
  const {
    filters,
    handleClearFilters,
    handleCloseInvitationLinkDialog,
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
    invitationLinkDialog,
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

        <CollaboratorListContent
          hasActiveFilters={hasActiveFilters}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          isReadOnly={isReadOnly}
          isResendingCollaboratorId={isResendingCollaboratorId}
          items={items}
          onClearFilters={handleClearFilters}
          onDeactivate={handleOpenDeactivateDialog}
          onEdit={handleNavigateToEdit}
          onNextPageClick={handleNextPageClick}
          onPermissions={handleNavigateToPermissions}
          onPreviousPageClick={handlePreviousPageClick}
          onReactivate={handleOpenReactivateDialog}
          onResendEmail={(collaborator): void => {
            void handleResendEmail(collaborator);
          }}
          onRetry={handleRetry}
          onViewDetail={handleNavigateToDetail}
          pageNumber={pageNumber}
          totalCount={totalCount}
          viewState={viewState}
        />
      </div>

      <CollaboratorStatusDialog
        collaboratorName={statusDialog.collaborator?.fullName ?? ""}
        hasBookingsLoadError={statusDialog.hasBookingsLoadError}
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

      <CollaboratorInvitationLinkDialog
        dialog={invitationLinkDialog}
        onClose={handleCloseInvitationLinkDialog}
      />
    </PageTemplate>
  );
};
