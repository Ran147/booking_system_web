import { Headphones, HelpCircle, MessageSquare } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  BADGE_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { cn } from "@/utils/cn";
import type { HelpSupportBannerProps } from "../models/help.model";

export const HelpSupportBanner = ({
  className,
  isSubscriber,
  onGoToContact,
  onGoToFaq,
  onGoToSupportTickets,
}: HelpSupportBannerProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {isSubscriber && (
        <Card
          aria-labelledby="subscriber-support-title"
          className="border-primary/30 bg-primary/5 shadow-sm"
          data-testid="subscriber-support-card"
        >
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Headphones className="size-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <CardTitle
                    className="text-lg font-bold text-foreground"
                    id="subscriber-support-title"
                  >
                    {t("help.subscriberSupport.title")}
                  </CardTitle>
                  <Badge variant={BADGE_VARIANT.PRIMARY}>
                    {t("help.subscriberSupport.badge")}
                  </Badge>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  {t("help.subscriberSupport.description")}
                </CardDescription>
              </div>
            </div>

            <Button
              ariaLabel={t("help.subscriberSupport.action")}
              className="mt-2 shrink-0 sm:mt-0"
              onClick={onGoToSupportTickets}
              size={BUTTON_SIZE.SM}
              type="button"
            >
              {t("help.subscriberSupport.action")}
            </Button>
          </CardHeader>
        </Card>
      )}

      <Card
        aria-labelledby="public-support-title"
        className="border-border bg-card shadow-sm"
        data-testid="public-support-card"
      >
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <MessageSquare className="size-5" />
            </div>
            <div className="flex flex-col">
              <CardTitle
                className="text-lg font-bold text-foreground"
                id="public-support-title"
              >
                {t("help.publicSupport.title")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("help.publicSupport.description")}
              </CardDescription>
            </div>
          </div>

          <Button
            ariaLabel={t("help.publicSupport.action")}
            className="mt-2 shrink-0 sm:mt-0"
            onClick={onGoToContact}
            size={BUTTON_SIZE.SM}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("help.publicSupport.action")}
          </Button>
        </CardHeader>

        <CardContent className="border-t border-border/50 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              <span>{t("help.page.faqPrompt")}</span>
            </div>
            <Button
              ariaLabel={t("help.page.faqAction")}
              className="h-auto p-0 text-sm font-medium text-primary underline"
              onClick={onGoToFaq}
              size={BUTTON_SIZE.SM}
              type="button"
              variant={BUTTON_VARIANT.LINK}
            >
              {t("help.page.faqAction")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
