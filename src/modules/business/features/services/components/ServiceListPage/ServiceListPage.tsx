import { AlertTriangle, Briefcase, Plus } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  PageTemplate,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  SERVICE_TABLE_COLUMN_COUNT,
  useServiceListViewModel,
} from "@/modules/business/features/services";
import type { ServiceListPageProps } from "./types/ServiceListPage.types";

export const ServiceListPage = ({
  businessStatus,
  onCreateService,
}: ServiceListPageProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const viewModel = useServiceListViewModel({
    businessStatus,
    onCreateService,
  });

  return (
    <PageTemplate
      actions={
        <Button
          ariaLabel={t("services.list.createServiceAction")}
          disabled={viewModel.isReadOnly}
          leftIcon={Plus}
          onClick={viewModel.handleCreateService}
          size="md"
          type="button"
          variant="default"
        >
          {t("services.list.createServiceAction")}
        </Button>
      }
      description={t("services.list.description")}
      title={t("services.list.title")}
    >
      {viewModel.isReadOnly && (
        <div
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{t("errors.readOnly")}</p>
            <p className="text-xs opacity-90">
              {t("services.list.readOnlyNotice")}
            </p>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("services.list.name")}</TableHead>
            <TableHead>{t("services.list.duration")}</TableHead>
            <TableHead>{t("services.list.price")}</TableHead>
            <TableHead>{t("services.list.status")}</TableHead>
            <TableHead className="text-right">
              {t("services.list.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {viewModel.isEmpty ? (
            <TableRow>
              <TableCell
                className="h-64 text-center"
                colSpan={SERVICE_TABLE_COLUMN_COUNT}
              >
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">
                      {t("services.list.emptyTitle")}
                    </p>
                    <p className="max-w-md text-sm text-muted-foreground">
                      {t("services.list.emptyDescription")}
                    </p>
                  </div>
                  <Button
                    ariaLabel={t("services.list.createServiceAction")}
                    disabled={viewModel.isReadOnly}
                    leftIcon={Plus}
                    onClick={viewModel.handleCreateService}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {t("services.list.createServiceAction")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </PageTemplate>
  );
};
