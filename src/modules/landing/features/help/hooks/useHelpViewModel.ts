import { Calendar, Compass, CreditCard } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/shared/constants";
import { USER_ROLE } from "@/shared/domain";
import { HELP_PAGE_CONSTANTS } from "../constants/help.constants";
import type { HelpTopicItem, HelpViewModel } from "../models/help.model";

export const useHelpViewModel = (): HelpViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const navigate = useNavigate();
  const session = useSession();

  const isSubscriber =
    session.status === SESSION_STATUS.SIGNED_IN &&
    session.role === USER_ROLE.SUBSCRIBER;

  const topics: readonly HelpTopicItem[] = useMemo(
    () => [
      {
        description: t("help.topics.gettingStarted.description"),
        icon: Compass,
        id: HELP_PAGE_CONSTANTS.TOPIC_IDS.GETTING_STARTED,
        steps: [
          t("help.topics.gettingStarted.step1"),
          t("help.topics.gettingStarted.step2"),
          t("help.topics.gettingStarted.step3"),
        ],
        title: t("help.topics.gettingStarted.title"),
      },
      {
        description: t("help.topics.managingSchedule.description"),
        icon: Calendar,
        id: HELP_PAGE_CONSTANTS.TOPIC_IDS.MANAGING_SCHEDULE,
        steps: [
          t("help.topics.managingSchedule.step1"),
          t("help.topics.managingSchedule.step2"),
          t("help.topics.managingSchedule.step3"),
        ],
        title: t("help.topics.managingSchedule.title"),
      },
      {
        description: t("help.topics.subscriptionsAndPlans.description"),
        icon: CreditCard,
        id: HELP_PAGE_CONSTANTS.TOPIC_IDS.SUBSCRIPTIONS_AND_PLANS,
        steps: [
          t("help.topics.subscriptionsAndPlans.step1"),
          t("help.topics.subscriptionsAndPlans.step2"),
          t("help.topics.subscriptionsAndPlans.step3"),
        ],
        title: t("help.topics.subscriptionsAndPlans.title"),
      },
    ],
    [t],
  );

  const handleGoToContact = (): void => {
    void navigate(ROUTE_PATH.LANDING.CONTACT);
  };

  const handleGoToFaq = (): void => {
    void navigate(`${ROUTE_PATH.LANDING.CONTACT}#faq`);
  };

  const handleGoToSupportTickets = (): void => {
    void navigate(ROUTE_PATH.BUSINESS.ROOT);
  };

  return {
    handleGoToContact,
    handleGoToFaq,
    handleGoToSupportTickets,
    isSubscriber,
    topics,
  };
};
