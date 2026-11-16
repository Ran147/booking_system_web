import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  BADGE_VARIANT,
  Button,
  BUTTON_VARIANT,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
} from "@/components/common";
import { APP_TIME_ZONE, I18N_NAMESPACE } from "@/constants";
import { COLLABORATOR_STATUS_TONE } from "@/domain";
import { formatDateTime } from "@/utils";
import { CollaboratorProfileBadgesCard } from "./CollaboratorProfileBadgesCard";
import type { CollaboratorDetailData } from "../models";

interface CollaboratorProfileDetailsProps {
  readonly collaborator: CollaboratorDetailData;
  readonly onBackToList: () => void;
}

export const CollaboratorProfileDetails = ({
  collaborator,
  onBackToList,
}: CollaboratorProfileDetailsProps): ReactElement => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  const formattedLastSent = collaborator.lastEmailSentAt
    ? formatDateTime(
        new Date(collaborator.lastEmailSentAt),
        APP_TIME_ZONE.COSTA_RICA,
        i18n.language,
      )
    : t("business:collaborators.profile.neverSent");

  const profileFields = [
    {
      label: t("business:collaborators.profile.emailLabel"),
      value: collaborator.email,
    },
    {
      label: t("business:collaborators.profile.phoneLabel"),
      value: collaborator.phone,
    },
    {
      label: t("business:collaborators.profile.specialtyLabel"),
      value:
        collaborator.specialty ??
        t("business:collaborators.profile.noSpecialty"),
    },
    {
      label: t("business:collaborators.resend.lastSentLabel"),
      value: formattedLastSent,
    },
  ];

  const serviceItems = collaborator.services.map((service) => ({
    id: service.id,
    label: service.name,
  }));
  const permissionItems = collaborator.permissions.map((permission) => ({
    id: permission,
    label: t(`business:collaborators.permissions.items.${permission}.label`),
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{collaborator.fullName}</CardTitle>
            <StatusBadge tone={COLLABORATOR_STATUS_TONE[collaborator.status]}>
              {t(`common:collaboratorStatus.${collaborator.status}`)}
            </StatusBadge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {profileFields.map((field) => (
            <div key={field.label}>
              <p className="text-xs font-medium text-muted-foreground">
                {field.label}
              </p>
              <p className="text-sm text-foreground">{field.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <CollaboratorProfileBadgesCard
        badgeVariant={BADGE_VARIANT.SECONDARY}
        emptyMessage={t("business:collaborators.profile.noServices")}
        items={serviceItems}
        title={t("business:collaborators.profile.servicesTitle")}
      />

      <CollaboratorProfileBadgesCard
        badgeVariant={BADGE_VARIANT.OUTLINE}
        emptyMessage={t("business:collaborators.permissions.noPermissionsNote")}
        items={permissionItems}
        title={t("business:collaborators.permissions.sectionTitle")}
      />

      <div>
        <Button
          onClick={onBackToList}
          type="button"
          variant={BUTTON_VARIANT.OUTLINE}
        >
          {t("business:collaborators.profile.backAction")}
        </Button>
      </div>
    </>
  );
};
