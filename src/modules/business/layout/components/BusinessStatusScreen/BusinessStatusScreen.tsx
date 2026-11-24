import { LogOut } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_VARIANT,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { BusinessStatusScreenProps } from "@/modules/business/layout/models";

// Full-page frame of the "under review" and "rejected" screens: they replace
// the whole portal, so the only action is signing out (AC-KAN-33-09, 11).
export const BusinessStatusScreen = ({
  children,
  description,
  isSigningOut,
  onSignOut,
  title,
}: BusinessStatusScreenProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12 text-foreground">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter>
          <Button
            isLoading={isSigningOut}
            leftIcon={LogOut}
            onClick={onSignOut}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("layout.statusGate.signOutAction")}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
};
