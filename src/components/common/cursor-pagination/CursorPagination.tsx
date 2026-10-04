import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { CursorPaginationProps } from "./CursorPaginationProps.interface";
import { Button } from "../ui/button";

export const CursorPagination = ({
  hasNextPage,
  hasPreviousPage,
  onNextPageClick,
  onPreviousPageClick,
  pageNumber,
  totalCount,
}: CursorPaginationProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex items-center justify-end gap-2"
    >
      <span className="text-sm text-muted-foreground">
        {t("pagination.summary", { count: totalCount, pageNumber })}
      </span>
      <Button
        disabled={!hasPreviousPage}
        onClick={onPreviousPageClick}
        variant="outline"
      >
        {t("pagination.previousAction")}
      </Button>
      <Button
        disabled={!hasNextPage}
        onClick={onNextPageClick}
        variant="outline"
      >
        {t("pagination.nextAction")}
      </Button>
    </nav>
  );
};
