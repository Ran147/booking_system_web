import { useState, type ReactElement } from "react";
import type { Nullable } from "@/types";
import { MetricCard, PlaceholderDialog, QuickAccessCard } from "./components";
import type { PortalHomeTemplateProps, PortalQuickAccessItem } from "./models";

export const PortalHomeTemplate = ({
  actions,
  badge,
  configurationItems,
  configurationsSectionDescription,
  configurationsSectionTitle,
  description,
  greeting,
  metrics,
  onSelectPlaceholder,
  quickAccessItems,
  quickAccessSectionDescription,
  quickAccessSectionTitle,
  readOnlyAlert,
  title,
}: PortalHomeTemplateProps): ReactElement => {
  const [activePlaceholderItem, setActivePlaceholderItem] =
    useState<Nullable<PortalQuickAccessItem>>(null);

  const handleActionClick = (item: PortalQuickAccessItem): void => {
    if (item.isAvailable) {
      item.onClick?.();
    } else {
      setActivePlaceholderItem(item);
      onSelectPlaceholder?.(item);
    }
  };

  const handleClosePlaceholderModal = (): void => {
    setActivePlaceholderItem(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          {greeting && (
            <p className="text-sm font-medium tracking-wide text-primary">
              {greeting}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>

      {readOnlyAlert}

      {metrics && metrics.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </section>
      )}

      <section aria-labelledby="quick-access-heading" className="space-y-4">
        <div className="space-y-1">
          <h2
            className="font-headline text-2xl font-bold tracking-tight text-foreground"
            id="quick-access-heading"
          >
            {quickAccessSectionTitle}
          </h2>
          {quickAccessSectionDescription && (
            <p className="text-sm text-muted-foreground">
              {quickAccessSectionDescription}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickAccessItems.map((item) => (
            <QuickAccessCard
              item={item}
              key={item.id}
              onActionClick={handleActionClick}
            />
          ))}
        </div>
      </section>

      {configurationItems && configurationItems.length > 0 && (
        <section
          aria-labelledby="configurations-heading"
          className="space-y-4 pt-4"
        >
          <div className="space-y-1">
            {configurationsSectionTitle && (
              <h2
                className="font-headline text-2xl font-bold tracking-tight text-foreground"
                id="configurations-heading"
              >
                {configurationsSectionTitle}
              </h2>
            )}
            {configurationsSectionDescription && (
              <p className="text-sm text-muted-foreground">
                {configurationsSectionDescription}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {configurationItems.map((item) => (
              <QuickAccessCard
                item={item}
                key={item.id}
                onActionClick={handleActionClick}
              />
            ))}
          </div>
        </section>
      )}

      <PlaceholderDialog
        item={activePlaceholderItem}
        onClose={handleClosePlaceholderModal}
      />
    </div>
  );
};
