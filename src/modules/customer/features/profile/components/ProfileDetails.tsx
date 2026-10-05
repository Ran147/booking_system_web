import { Mail, Phone, UserRound } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { ProfileDetailsProps } from "../models";

export const ProfileDetails = ({
  profile,
}: ProfileDetailsProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const notProvidedHint = t("profile.view.notProvidedHint");
  const profileFields = [
    {
      icon: UserRound,
      label: t("profile.view.fullNameLabel"),
      value: profile.fullName,
    },
    {
      icon: Mail,
      label: t("profile.view.emailLabel"),
      value: profile.email,
    },
    {
      icon: Phone,
      label: t("profile.view.phoneLabel"),
      value: profile.phone,
    },
  ];

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="font-headline text-xl text-card-foreground">
          {t("profile.view.sectionTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <dl className="divide-y divide-border">
          {profileFields.map((profileField) => {
            const FieldIcon = profileField.icon;

            return (
              <div
                className="grid gap-3 px-6 py-5 sm:grid-cols-[2.5rem_12rem_1fr] sm:items-center sm:gap-4"
                key={profileField.label}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FieldIcon aria-hidden="true" className="size-5" />
                </span>
                <dt className="text-sm font-semibold text-muted-foreground">
                  {profileField.label}
                </dt>
                <dd className="break-words text-sm text-card-foreground sm:text-base">
                  {profileField.value ?? notProvidedHint}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
};
