import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { HelpSupportBanner, HelpTopicCard } from "./components";
import { HELP_PAGE_CONSTANTS } from "./constants/help.constants";
import { useHelpViewModel } from "./hooks/useHelpViewModel";

export const HelpPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const {
    handleGoToContact,
    handleGoToFaq,
    handleGoToSupportTickets,
    isSubscriber,
    topics,
  } = useHelpViewModel();

  return (
    <section
      aria-labelledby={HELP_PAGE_CONSTANTS.SECTION_IDS.HEADER}
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <header className="mb-12 text-center">
        <h1
          className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          id={HELP_PAGE_CONSTANTS.SECTION_IDS.HEADER}
        >
          {t("help.page.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("help.page.description")}
        </p>
      </header>

      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        id={HELP_PAGE_CONSTANTS.SECTION_IDS.TOPICS}
      >
        {topics.map((topic) => (
          <HelpTopicCard key={topic.id} topic={topic} />
        ))}
      </div>

      <div className="mt-12" id={HELP_PAGE_CONSTANTS.SECTION_IDS.SUPPORT}>
        <HelpSupportBanner
          isSubscriber={isSubscriber}
          onGoToContact={handleGoToContact}
          onGoToFaq={handleGoToFaq}
          onGoToSupportTickets={handleGoToSupportTickets}
        />
      </div>
    </section>
  );
};
