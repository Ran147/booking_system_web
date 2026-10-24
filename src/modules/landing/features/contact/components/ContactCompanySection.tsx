import { ArrowRight, Compass, Target } from "lucide-react";
import type { ReactElement } from "react";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common";

export interface ContactCompanySectionProps {
  readonly companyDescription: string;
  readonly companyPlansActionLabel: string;
  readonly companyTitle: string;
  readonly missionDescription: string;
  readonly missionTitle: string;
  readonly onNavigateToPlans: () => void;
  readonly visionDescription: string;
  readonly visionTitle: string;
}

export const ContactCompanySection = ({
  companyDescription,
  companyPlansActionLabel,
  companyTitle,
  missionDescription,
  missionTitle,
  onNavigateToPlans,
  visionDescription,
  visionTitle,
}: ContactCompanySectionProps): ReactElement => {
  return (
    <section aria-labelledby="company-section-title" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target aria-hidden="true" className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold">{missionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {missionDescription}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Compass aria-hidden="true" className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold">{visionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {visionDescription}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-muted/30 shadow-xs">
        <CardHeader>
          <CardTitle id="company-section-title" className="text-xl font-bold">
            {companyTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {companyDescription}
          </p>
          <div>
            <Button
              ariaLabel={companyPlansActionLabel}
              onClick={onNavigateToPlans}
              rightIcon={ArrowRight}
              size={BUTTON_SIZE.DEFAULT}
              variant={BUTTON_VARIANT.OUTLINE}
            >
              {companyPlansActionLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
