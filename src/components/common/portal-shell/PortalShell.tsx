import type { ReactElement, ReactNode } from "react";

export interface PortalShellProps {
  children: ReactNode;
  footer?: ReactNode;
  title: string;
}

// Minimal chrome shared by the four portal layouts until each portal builds
// its own navbar, sidebar and footer from its layout spec.
export const PortalShell = ({
  children,
  footer,
  title,
}: PortalShellProps): ReactElement => (
  <div className="flex min-h-screen flex-col bg-background text-foreground">
    <header className="border-b border-border px-6 py-4">
      <p className="text-lg font-semibold">{title}</p>
    </header>
    <main className="flex-1 px-6 py-8">{children}</main>
    {footer}
  </div>
);
