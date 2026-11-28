import { ChevronRight } from "lucide-react";
import type { ReactElement } from "react";
import { AppLink, Card, CardDescription, CardTitle } from "@/components/common";
import type { SettingsNavigationCardProps } from "./SettingsNavigationCard.types";

export const SettingsNavigationCard = ({
  description,
  icon: Icon,
  linkLabel,
  title,
  to,
}: SettingsNavigationCardProps): ReactElement => (
  <AppLink
    aria-label={linkLabel}
    className="group block max-w-2xl rounded-xl no-underline outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    to={to}
  >
    <Card
      className="flex items-center gap-4 p-5 group-hover:border-primary/60 group-hover:shadow-md"
      hoverable
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Card>
  </AppLink>
);
