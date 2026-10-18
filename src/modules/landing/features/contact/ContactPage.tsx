import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { ContactForm } from "./components/ContactForm";

export const ContactPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <section
      aria-labelledby="contact-heading"
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"
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

      <ContactForm />
    </section>
  );
};
