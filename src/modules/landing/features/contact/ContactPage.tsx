import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import type { LandingFooterConfig } from "@/modules/landing/layout/models";
import { ContactDirectChannels } from "./components/ContactDirectChannels";
import { ContactForm } from "./components/ContactForm";
import { useContactChannelsViewModel } from "./hooks/useContactChannelsViewModel";

export interface ContactPageProps {
  configOverride?: LandingFooterConfig;
}

export const ContactPage = ({
  configOverride,
}: ContactPageProps = {}): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const { hasAnyChannels } = useContactChannelsViewModel(configOverride);

  return (
    <section
      aria-labelledby="contact-heading"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <header className="mb-10 text-center">
        <h1
          className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          id="contact-heading"
        >
          {t("contact.page.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("contact.page.description")}
        </p>
      </header>

      {hasAnyChannels ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <aside
            aria-label={t("contact.channels.sectionAriaLabel")}
            className="lg:col-span-5"
          >
            <ContactDirectChannels configOverride={configOverride} />
          </aside>
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <ContactForm />
        </div>
      )}
    </section>
  );
};
