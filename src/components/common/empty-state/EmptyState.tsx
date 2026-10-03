import type { ReactElement } from "react";

export interface EmptyStateProps {
  message: string;
}

export const EmptyState = ({ message }: EmptyStateProps): ReactElement => (
  <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
    <p>{message}</p>
  </div>
);
