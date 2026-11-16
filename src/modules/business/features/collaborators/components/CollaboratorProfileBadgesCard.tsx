import type { ReactElement } from "react";
import {
  Badge,
  type BadgeVariant,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common";

interface CollaboratorProfileBadgeItem {
  readonly id: string;
  readonly label: string;
}

interface CollaboratorProfileBadgesCardProps {
  readonly badgeVariant: BadgeVariant;
  readonly emptyMessage: string;
  readonly items: readonly CollaboratorProfileBadgeItem[];
  readonly title: string;
}

export const CollaboratorProfileBadgesCard = ({
  badgeVariant,
  emptyMessage,
  items,
  title,
}: CollaboratorProfileBadgesCardProps): ReactElement => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-2">
      {items.length > 0 ? (
        items.map((item) => (
          <Badge key={item.id} variant={badgeVariant}>
            {item.label}
          </Badge>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </CardContent>
  </Card>
);
