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
import {
  SupportTicketDetailDrawer,
  SupportTicketFilterBar,
  SupportTicketTable,
} from "./components";
import { useSupportTicketsViewModel } from "./hooks";

export const SupportTicketsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.ADMIN);
  const {
    activeTicket,
    closeConfirmModal,
    closeDrawer,
    filterStatus,
    handleFilterStatusChange,
    handleReplyTicket,
    handleResolveTicket,
    hasNextPage,
    hasPreviousPage,
    isConfirmModalOpen,
    isDrawerOpen,
    isError,
    isLoading,
    isReplying,
    isResolving,
    nextPage,
    openConfirmModal,
    openDrawer,
    pageNumber,
    previousPage,
    refetch,
    tickets,
    totalCount,
  } = useSupportTicketsViewModel();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("supportTickets.list.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("supportTickets.list.description")}
        </p>
      </div>

      <SupportTicketFilterBar
        onStatusChange={handleFilterStatusChange}
        selectedStatus={filterStatus}
      />

      {isLoading && <Spinner />}

      {isError && (
        <div className="space-y-4">
          <ErrorState messageKey={ERROR_MESSAGE_KEY.NETWORK} />
          <div className="flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("supportTickets.list.retryAction")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && tickets.length === 0 && (
        <EmptyState message={t("supportTickets.list.empty")} />
      )}

      {!isLoading && !isError && tickets.length > 0 && (
        <div className="space-y-4">
          <SupportTicketTable onSelectTicket={openDrawer} tickets={tickets} />
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

      <SupportTicketDetailDrawer
        isConfirmModalOpen={isConfirmModalOpen}
        isOpen={isDrawerOpen}
        isReplying={isReplying}
        isResolving={isResolving}
        onClose={closeDrawer}
        onCloseConfirmModal={closeConfirmModal}
        onOpenConfirmModal={openConfirmModal}
        onReply={handleReplyTicket}
        onResolve={handleResolveTicket}
        ticket={activeTicket}
      />
    </div>
  );
};
