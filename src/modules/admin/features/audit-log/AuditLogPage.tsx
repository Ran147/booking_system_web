import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  CursorPagination,
  EmptyState,
  ErrorState,
  Spinner,
} from "@/components/common";
import { ERROR_MESSAGE_KEY } from "@/constants/i18n/ErrorMessageKey.constants";
import { I18N_NAMESPACE } from "@/shared/constants";
import { AuditLogDetailModal, AuditLogTable } from "./components";
import { useAuditLogViewModel } from "./hooks";

export const AuditLogPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.ADMIN);
  const {
    activeEntry,
    closeModal,
    entries,
    hasNextPage,
    hasPreviousPage,
    isError,
    isLoading,
    isModalOpen,
    nextPage,
    openModal,
    pageNumber,
    previousPage,
    refetch,
    totalCount,
  } = useAuditLogViewModel();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("auditLog.list.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("auditLog.list.description")}
        </p>
      </div>

      {isLoading && <Spinner />}

      {isError && (
        <div className="space-y-4">
          <ErrorState messageKey={ERROR_MESSAGE_KEY.NETWORK} />
          <div className="flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("auditLog.list.retryAction")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <EmptyState message={t("auditLog.list.empty")} />
      )}

      {!isLoading && !isError && entries.length > 0 && (
        <div className="space-y-4">
          <AuditLogTable entries={entries} onSelectEntry={openModal} />
          <CursorPagination
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onNextPageClick={nextPage}
            onPreviousPageClick={previousPage}
            pageNumber={pageNumber}
            totalCount={totalCount}
          />
        </div>
      )}

      <AuditLogDetailModal
        entry={activeEntry}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};
