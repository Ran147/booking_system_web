import type { ComponentProps, ReactElement } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/utils/cn";
import {
  APP_LINK_VARIANT,
  type AppLinkVariant,
} from "./AppLinkVariant.constants";
import { buttonVariants } from "../ui/button";

export interface AppLinkProps extends Omit<
  ComponentProps<typeof Link>,
  "className" | "to"
> {
  className?: string;
  to: string;
  variant?: AppLinkVariant;
}

const CLASS_NAME_BY_VARIANT = {
  [APP_LINK_VARIANT.BUTTON]: buttonVariants(),
  [APP_LINK_VARIANT.TEXT]:
    "text-primary underline-offset-4 hover:underline focus-visible:underline",
} satisfies Record<AppLinkVariant, string>;

export const AppLink = ({
  children,
  className,
  to,
  variant = APP_LINK_VARIANT.TEXT,
  ...restProperties
}: AppLinkProps): ReactElement => (
  <Link
    className={cn(CLASS_NAME_BY_VARIANT[variant], className)}
    to={to}
    {...restProperties}
  >
    {children}
  </Link>
);
