import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/shared/constants";
import { FAQ_CONSTANTS } from "../constants/faq.constants";
import type { FaqGroup, FaqItem, FaqViewModel } from "../models/faq.model";

export const useFaqViewModel = (): FaqViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const navigate = useNavigate();
  const [expandedItemIds, setExpandedItemIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const groups: readonly FaqGroup[] = useMemo(() => {
    const rawGroups: Array<{
      id: string;
      items: Array<{ answer: string; id: string; question: string }>;
      title: string;
    }> = [
      {
        id: FAQ_CONSTANTS.GROUP_IDS.SERVICES_AND_BOOKINGS,
        items: [
          {
            answer: t(
              "faq.groups.servicesAndBookings.items.clientBooking.answer",
            ),
            id: "client-booking",
            question: t(
              "faq.groups.servicesAndBookings.items.clientBooking.question",
            ),
          },
          {
            answer: t(
              "faq.groups.servicesAndBookings.items.calendarSync.answer",
            ),
            id: "calendar-sync",
            question: t(
              "faq.groups.servicesAndBookings.items.calendarSync.question",
            ),
          },
        ],
        title: t("faq.groups.servicesAndBookings.title"),
      },
      {
        id: FAQ_CONSTANTS.GROUP_IDS.PLANS_AND_BILLING,
        items: [
          {
            answer: t("faq.groups.plansAndBilling.items.changePlan.answer"),
            id: "change-plan",
            question: t("faq.groups.plansAndBilling.items.changePlan.question"),
          },
          {
            answer: t("faq.groups.plansAndBilling.items.paymentMethods.answer"),
            id: "payment-methods",
            question: t(
              "faq.groups.plansAndBilling.items.paymentMethods.question",
            ),
          },
        ],
        title: t("faq.groups.plansAndBilling.title"),
      },
      {
        id: FAQ_CONSTANTS.GROUP_IDS.ACCOUNT_AND_SECURITY,
        items: [
          {
            answer: t(
              "faq.groups.accountAndSecurity.items.dataSecurity.answer",
            ),
            id: "data-security",
            question: t(
              "faq.groups.accountAndSecurity.items.dataSecurity.question",
            ),
          },
          {
            answer: t("faq.groups.accountAndSecurity.items.multiUser.answer"),
            id: "multi-user",
            question: t(
              "faq.groups.accountAndSecurity.items.multiUser.question",
            ),
          },
        ],
        title: t("faq.groups.accountAndSecurity.title"),
      },
    ];

    // AC-KAN-18-03: omite entradas que carezcan de respuesta en el idioma activo
    return rawGroups
      .map((group) => ({
        id: group.id,
        items: group.items.filter(
          (item): item is FaqItem =>
            Boolean(item.question.trim()) && Boolean(item.answer.trim()),
        ),
        title: group.title,
      }))
      .filter((group) => group.items.length > 0);
  }, [t]);

  const isEmpty = groups.length === 0;

  const toggleItem = (itemId: string): void => {
    setExpandedItemIds((previous) => {
      const updated = new Set(previous);
      if (updated.has(itemId)) {
        updated.delete(itemId);
      } else {
        updated.add(itemId);
      }
      return updated;
    });
  };

  const handleGoToContact = (): void => {
    void navigate(ROUTE_PATH.LANDING.CONTACT);
  };

  return {
    expandedItemIds,
    groups,
    handleGoToContact,
    isEmpty,
    toggleItem,
  };
};
