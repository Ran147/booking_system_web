import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { FaqGroupSection } from "./components";
import { FAQ_CONSTANTS } from "./constants/faq.constants";
import { useFaqViewModel } from "./hooks/useFaqViewModel";

export const FaqPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const { expandedItemIds, groups, handleGoToContact, isEmpty, toggleItem } =
    useFaqViewModel();

  return (
    <section
      aria-labelledby={FAQ_CONSTANTS.SECTION_IDS.HEADER}
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <header className="mb-12 text-center">
        <h1
          className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          id={FAQ_CONSTANTS.SECTION_IDS.HEADER}
        >
          {t("faq.page.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("faq.page.description")}
        </p>
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <EmptyState message={t("faq.empty.description")} />
          <Button
            ariaLabel={t("faq.empty.action")}
            onClick={handleGoToContact}
            size={BUTTON_SIZE.MD}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("faq.empty.action")}
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col gap-10"
          id={FAQ_CONSTANTS.SECTION_IDS.LIST}
        >
          {groups.map((group) => (
            <FaqGroupSection
              expandedItemIds={expandedItemIds}
              group={group}
              key={group.id}
              onToggleItem={toggleItem}
            />
          ))}

          <Card
            aria-labelledby="faq-cta-title"
            className="mt-6 border-border bg-card p-6 text-center shadow-sm"
            id={FAQ_CONSTANTS.SECTION_IDS.CTA}
          >
            <CardHeader className="p-0">
              <CardTitle
                className="text-xl font-bold text-foreground"
                id="faq-cta-title"
              >
                {t("faq.cta.title")}
              </CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                {t("faq.cta.description")}
              </CardDescription>
            </CardHeader>
            <div className="mt-6 flex justify-center">
              <Button
                ariaLabel={t("faq.cta.action")}
                onClick={handleGoToContact}
                size={BUTTON_SIZE.MD}
                type="button"
                variant={BUTTON_VARIANT.PRIMARY}
              >
                {t("faq.cta.action")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
};
