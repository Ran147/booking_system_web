import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_VARIANT,
  CursorPagination,
  EmptyState,
  ErrorState,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE, VIEW_STATE, type ViewState } from "@/constants";
import type { Nullable } from "@/types";
import { CollaboratorListTable } from "./CollaboratorListTable";
import type { CollaboratorListItem } from "../models";

interface CollaboratorListContentProps {
  readonly hasActiveFilters: boolean;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly isReadOnly: boolean;
  readonly isResendingCollaboratorId: Nullable<string>;
  readonly items: readonly CollaboratorListItem[];
  readonly onClearFilters: () => void;
  readonly onDeactivate: (collaborator: CollaboratorListItem) => void;
  readonly onEdit: (collaboratorId: string) => void;
  readonly onNextPageClick: () => void;
  readonly onPermissions: (collaboratorId: string) => void;
  readonly onPreviousPageClick: () => void;
  readonly onReactivate: (collaborator: CollaboratorListItem) => void;
  readonly onResendEmail: (collaborator: CollaboratorListItem) => void;
  readonly onRetry: () => void;
  readonly onViewDetail: (collaboratorId: string) => void;
  readonly pageNumber: number;
  readonly totalCount: number;
  readonly viewState: ViewState;
}

export const CollaboratorListContent = ({
  hasActiveFilters,
  hasNextPage,
  hasPreviousPage,
  isReadOnly,
  isResendingCollaboratorId,
  items,
  onClearFilters,
  onDeactivate,
  onEdit,
  onNextPageClick,
  onPermissions,
  onPreviousPageClick,
  onReactivate,
  onResendEmail,
  onRetry,
  onViewDetail,
  pageNumber,
  totalCount,
  viewState,
}: CollaboratorListContentProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);

  if (viewState === VIEW_STATE.LOADING) {
    return <Spinner />;
  }

  if (viewState === VIEW_STATE.ERROR) {
    return (
      <div className="flex flex-col items-center gap-3">
        <ErrorState />
        <Button
          onClick={onRetry}
          type="button"
          variant={BUTTON_VARIANT.SECONDARY}
        >
          {t("business:collaborators.list.retryAction")}
        </Button>
      </div>
    );
  }

  if (viewState === VIEW_STATE.EMPTY) {
    return (
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
            onClick={onClearFilters}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("business:collaborators.list.clearFiltersAction")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <CollaboratorListTable
        isReadOnly={isReadOnly}
        isResendingCollaboratorId={isResendingCollaboratorId}
        items={items}
        onDeactivate={onDeactivate}
        onEdit={onEdit}
        onPermissions={onPermissions}
        onReactivate={onReactivate}
        onResendEmail={onResendEmail}
        onViewDetail={onViewDetail}
      />
      <CursorPagination
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onNextPageClick={onNextPageClick}
        onPreviousPageClick={onPreviousPageClick}
        pageNumber={pageNumber}
        totalCount={totalCount}
      />
    </>
  );
};
