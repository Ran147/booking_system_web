import { Mail, Phone } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  AppLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { Nullable } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import type { ContactDirectChannelsProps } from "./ContactDirectChannels.types";
import { ContactSocialIcon } from "./ContactSocialIcon";
import {
  CONTACT_CHANNEL_ICON,
  CONTACT_TARGET,
} from "../constants/contactChannels.constants";
import { useContactChannelsViewModel } from "../hooks/useContactChannelsViewModel";

/**
 * Componente presentacional para los medios de contacto directo (US-17 / KAN-17).
 * Muestra telefonos, correos y redes sociales oficiales en una tarjeta estructurada.
 */
export const ContactDirectChannels = ({
  className,
  configOverride,
}: ContactDirectChannelsProps): Nullable<ReactElement> => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const { channels, hasAnyChannels, hasChannels, hasSocial, socialLinks } =
    useContactChannelsViewModel(configOverride);

  if (!hasAnyChannels) {
    return null;
  }

  return (
    <Card className={cn("border-border bg-card shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          {t("contact.channels.cardTitle")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t("contact.channels.cardDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {hasChannels && (
          <ul className="space-y-3">
            {channels.map((channel) => (
              <li key={channel.id}>
                <AppLink
                  aria-label={channel.ariaLabel}
                  className="flex items-center gap-3.5 rounded-lg border border-border bg-background p-3.5 text-foreground transition-colors hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  to={channel.href}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {channel.icon === CONTACT_CHANNEL_ICON.EMAIL ? (
                      <Mail aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Phone aria-hidden="true" className="h-5 w-5" />
                    )}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      {channel.label}
                    </span>
                    <span className="text-sm font-semibold break-all text-foreground">
                      {channel.value}
                    </span>
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
        )}

        {hasSocial && (
          <div className="border-t border-border pt-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {t("contact.channels.socialTitle")}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {socialLinks.map((socialItem) => (
                <AppLink
                  aria-label={socialItem.ariaLabel}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  key={socialItem.network}
                  rel="noopener noreferrer"
                  target={CONTACT_TARGET.BLANK}
                  to={socialItem.url}
                >
                  <ContactSocialIcon network={socialItem.network} />
                </AppLink>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
