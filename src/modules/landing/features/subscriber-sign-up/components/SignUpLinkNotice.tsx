import type { ReactElement } from "react";
import { AppLink } from "@/shared/components";

export interface SignUpLinkNoticeProps {
  readonly actionLabel: string;
  readonly actionPath: string;
  readonly message: string;
}

// Shown instead of the form when the page has no usable sign-up link
// (AC-KAN-25-20, AC-KAN-25-21).
export const SignUpLinkNotice = ({
  actionLabel,
  actionPath,
  message,
}: SignUpLinkNoticeProps): ReactElement => (
  <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border p-8 text-center">
    <p className="text-muted-foreground">{message}</p>
    <AppLink to={actionPath}>{actionLabel}</AppLink>
  </div>
);
