import type { ReactElement } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/components";
import { PLAN_CATALOG_CONSTANTS } from "../constants/PlanCatalog.constants";

export const PlanCatalogSkeleton = (): ReactElement => {
  const skeletonArray = Array.from({
    length: PLAN_CATALOG_CONSTANTS.SKELETON_COUNT,
  });

  return (
    <div
      aria-busy="true"
      className={PLAN_CATALOG_CONSTANTS.GRID_LAYOUT}
      data-testid="plan-catalog-skeleton"
    >
      {skeletonArray.map((_, index) => (
        <Card
          className="flex h-96 animate-pulse flex-col justify-between border-border"
          key={`skeleton-card-${index}`}
        >
          <CardHeader className="space-y-3">
            <div className="h-6 w-3/4 rounded bg-muted" />
            <div className="h-8 w-1/2 rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </CardContent>
          <CardFooter>
            <div className="h-10 w-full rounded bg-muted" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
