import type { ReactElement } from "react";
import {
  AppLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common";
import type { ContactChannelItem } from "../models/contact.model";

export interface ContactChannelsSectionProps {
  readonly channels: readonly ContactChannelItem[];
  readonly title: string;
}

export const ContactChannelsSection = ({
  channels,
  title,
}: ContactChannelsSectionProps): ReactElement => {
  return (
    <section aria-labelledby="channels-section-title" className="space-y-6">
      <h2
        id="channels-section-title"
        className="text-2xl font-bold tracking-tight text-foreground"
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((channelItem) => {
          const IconComponent = channelItem.icon;
          return (
            <Card
              className="flex flex-col justify-between border-border/70 transition-shadow hover:shadow-md"
              key={channelItem.id}
            >
              <CardHeader className="space-y-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconComponent aria-hidden="true" className="size-5" />
                </div>
                <CardTitle className="text-base font-semibold">
                  {channelItem.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {channelItem.href ? (
                  <AppLink
                    className="inline-block break-all font-medium text-primary hover:underline"
                    rel={
                      channelItem.isExternal ? "noopener noreferrer" : undefined
                    }
                    target={channelItem.isExternal ? "_blank" : undefined}
                    to={channelItem.href}
                  >
                    {channelItem.label}
                  </AppLink>
                ) : (
                  <p className="font-medium text-foreground">
                    {channelItem.label}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {channelItem.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
