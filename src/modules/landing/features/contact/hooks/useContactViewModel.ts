import { Clock, Mail, MessageSquare, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/shared/constants";
import type {
  ContactChannelItem,
  ContactFaqItem,
  ContactViewModel,
} from "../models/contact.model";

export const useContactViewModel = (): ContactViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const navigate = useNavigate();

  const handleNavigateToPlans = (): void => {
    void navigate(`${ROUTE_PATH.LANDING.HOME}#plans-section`);
  };

  const channels: readonly ContactChannelItem[] = [
    {
      description: t("contact.channels.email.description"),
      href: `mailto:${t("contact.channels.email.label")}`,
      icon: Mail,
      id: "email",
      isExternal: true,
      label: t("contact.channels.email.label"),
      title: t("contact.channels.email.title"),
    },
    {
      description: t("contact.channels.phone.description"),
      href: `tel:${t("contact.channels.phone.label").replace(/\s+/g, "")}`,
      icon: Phone,
      id: "phone",
      isExternal: true,
      label: t("contact.channels.phone.label"),
      title: t("contact.channels.phone.title"),
    },
    {
      description: t("contact.channels.hours.description"),
      icon: Clock,
      id: "hours",
      label: t("contact.channels.hours.label"),
      title: t("contact.channels.hours.title"),
    },
    {
      description: t("contact.channels.social.description"),
      icon: MessageSquare,
      id: "social",
      label: t("footer.brandName"),
      title: t("contact.channels.social.title"),
    },
  ];

  const faqItems: readonly ContactFaqItem[] = [
    {
      answer: t("contact.faq.items.item1.answer"),
      id: "faq-1",
      question: t("contact.faq.items.item1.question"),
    },
    {
      answer: t("contact.faq.items.item2.answer"),
      id: "faq-2",
      question: t("contact.faq.items.item2.question"),
    },
    {
      answer: t("contact.faq.items.item3.answer"),
      id: "faq-3",
      question: t("contact.faq.items.item3.question"),
    },
    {
      answer: t("contact.faq.items.item4.answer"),
      id: "faq-4",
      question: t("contact.faq.items.item4.question"),
    },
    {
      answer: t("contact.faq.items.item5.answer"),
      id: "faq-5",
      question: t("contact.faq.items.item5.question"),
    },
  ];

  return {
    backToHomeLabel: t("contact.backToHome"),
    brandingTitle: t("layout.title"),
    channels,
    channelsTitle: t("contact.channels.title"),
    companyDescription: t("contact.about.company.description"),
    companyPlansActionLabel: t("contact.about.company.plansAction"),
    companyTitle: t("contact.about.company.title"),
    faqItems,
    faqSubtitle: t("contact.faq.subtitle"),
    faqTitle: t("contact.faq.title"),
    handleNavigateToPlans,
    helpActionLabel: t("contact.help.action"),
    helpDescription: t("contact.help.description"),
    helpTitle: t("contact.help.title"),
    missionDescription: t("contact.about.mission.description"),
    missionTitle: t("contact.about.mission.title"),
    pageSubtitle: t("contact.subtitle"),
    pageTitle: t("contact.title"),
    visionDescription: t("contact.about.vision.description"),
    visionTitle: t("contact.about.vision.title"),
  };
};
