import { Plus } from "lucide-react";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { Button, PageTemplate } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  CreateSupportTicketModal,
  SupportTicketDetailDrawer,
  SupportTicketList,
} from "./components";
import { useSupportTicketsViewModel } from "./hooks";

export const SupportPage = (): JSX.Element => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const viewModel = useSupportTicketsViewModel();

  const pageHeaderAction = (
    <Button onClick={viewModel.openCreateModal} type="button">
      <Plus className="mr-2 size-4" />
      {t("support.actions.newTicket")}
    </Button>
  );

  return (
    <PageTemplate
      actions={pageHeaderAction}
      description={t("support.list.pageDescription")}
      title={t("support.list.pageTitle")}
    >
      <div className="space-y-6">
        <SupportTicketList
          formatDateTime={viewModel.formatDateTime}
          isLoading={viewModel.isLoading}
          onOpenCreateModal={viewModel.openCreateModal}
          onSelectTicket={viewModel.openDetailDrawer}
          tickets={viewModel.tickets}
        />

        <CreateSupportTicketModal
          isOpen={viewModel.isCreateModalOpen}
          isSubmitting={viewModel.isCreating}
          onClose={viewModel.closeCreateModal}
          onSubmit={viewModel.handleCreateTicket}
        />

        <SupportTicketDetailDrawer
          formatDateTime={viewModel.formatDateTime}
          isOpen={viewModel.isDetailDrawerOpen}
          onClose={viewModel.closeDetailDrawer}
          ticket={viewModel.selectedTicket}
        />
      </div>
    </PageTemplate>
  );
};
