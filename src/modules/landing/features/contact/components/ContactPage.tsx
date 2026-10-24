import { ArrowLeft, Sparkles } from "lucide-react";
import type { ReactElement } from "react";
import {
  AppLink,
  Badge,
  BADGE_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  CardContent,
} from "@/components/common";
import { ROUTE_PATH } from "@/shared/constants";
import { ContactChannelsSection } from "./ContactChannelsSection";
import { ContactCompanySection } from "./ContactCompanySection";
import { ContactFaqSection } from "./ContactFaqSection";
import { useContactViewModel } from "../hooks/useContactViewModel";

export const ContactPage = (): ReactElement => {
  const viewModel = useContactViewModel();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <AppLink
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          to={ROUTE_PATH.LANDING.HOME}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span>{viewModel.backToHomeLabel}</span>
        </AppLink>
      </div>

      <header className="space-y-4">
        <div className="inline-flex items-center">
          <Badge leftIcon={Sparkles} variant={BADGE_VARIANT.DEFAULT}>
            {viewModel.brandingTitle}
          </Badge>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {viewModel.pageTitle}
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground sm:text-xl">
          {viewModel.pageSubtitle}
        </p>
      </header>

      <ContactCompanySection
        companyDescription={viewModel.companyDescription}
        companyPlansActionLabel={viewModel.companyPlansActionLabel}
        companyTitle={viewModel.companyTitle}
        missionDescription={viewModel.missionDescription}
        missionTitle={viewModel.missionTitle}
        onNavigateToPlans={viewModel.handleNavigateToPlans}
        visionDescription={viewModel.visionDescription}
        visionTitle={viewModel.visionTitle}
      />

      <ContactChannelsSection
        channels={viewModel.channels}
        title={viewModel.channelsTitle}
      />

      <ContactFaqSection
        faqItems={viewModel.faqItems}
        subtitle={viewModel.faqSubtitle}
        title={viewModel.faqTitle}
      />

      <Card className="border-primary/20 bg-primary/5 p-6 sm:p-8">
        <CardContent className="flex flex-col items-start justify-between gap-6 p-0 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              {viewModel.helpTitle}
            </h3>
            <p className="max-w-xl text-sm text-muted-foreground">
              {viewModel.helpDescription}
            </p>
          </div>
          <Button
            ariaLabel={viewModel.helpActionLabel}
            onClick={viewModel.handleNavigateToPlans}
            size={BUTTON_SIZE.LG}
            variant={BUTTON_VARIANT.DEFAULT}
          >
            {viewModel.helpActionLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
