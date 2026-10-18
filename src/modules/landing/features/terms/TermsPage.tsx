import type { ReactElement } from "react";
import { Button, BUTTON_VARIANT } from "@/components/common";
import { cn } from "@/shared/utils/cn";
import type { TermsPageProps } from "./TermsPage.types";
import { TermsSectionCard } from "./components/TermsSectionCard";
import { TERMS_CONSTANTS } from "./constants/Terms.constants";
import { useTermsViewModel } from "./hooks/useTermsViewModel";

export type { TermsPageProps };

export const TermsPage = ({ className }: TermsPageProps): ReactElement => {
  const viewModel = useTermsViewModel();

  return (
    <div
      className={cn("mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8", className)}
      id={TERMS_CONSTANTS.CONTAINER_ID}
    >
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
            id={TERMS_CONSTANTS.HEADING_ID}
          >
            {viewModel.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewModel.lastUpdated}
          </p>
        </div>
        <Button
          onClick={viewModel.handleBackToHome}
          variant={BUTTON_VARIANT.OUTLINE}
        >
          {viewModel.backToHomeLabel}
        </Button>
      </div>

      <div className="space-y-6">
        {viewModel.clauses.map((clause) => (
          <TermsSectionCard clause={clause} key={clause.id} />
        ))}
      </div>
    </div>
  );
};
