import type { ReactElement, ReactNode } from "react";

export interface PageTemplateProps {
  actions?: ReactNode;
  children?: ReactNode;
  description?: string;
  title: string;
}

export const PageTemplate = ({
  actions,
  children,
  description,
  title,
}: PageTemplateProps): ReactElement => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
    {children}
  </div>
);
