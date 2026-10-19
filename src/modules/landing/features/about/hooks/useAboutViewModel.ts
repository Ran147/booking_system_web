import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import {
  ABOUT_ICON_TYPE,
  ABOUT_MILESTONES,
  ABOUT_OFFERINGS,
  ABOUT_STATS,
} from "../constants/about.constants";
import type {
  AboutMilestoneItem,
  AboutOfferingItem,
  AboutStatItem,
  UseAboutViewModelReturn,
} from "../models/about.model";

const MILESTONE_KEYS = {
  [ABOUT_MILESTONES.M1]: {
    description: "about.history.milestones.m1.description",
    title: "about.history.milestones.m1.title",
    year: "about.history.milestones.m1.year",
  },
  [ABOUT_MILESTONES.M2]: {
    description: "about.history.milestones.m2.description",
    title: "about.history.milestones.m2.title",
    year: "about.history.milestones.m2.year",
  },
  [ABOUT_MILESTONES.M3]: {
    description: "about.history.milestones.m3.description",
    title: "about.history.milestones.m3.title",
    year: "about.history.milestones.m3.year",
  },
} as const;

const OFFERING_KEYS = {
  [ABOUT_OFFERINGS.ANALYTICS]: {
    description: "about.offerings.items.analytics.description",
    icon: ABOUT_ICON_TYPE.ANALYTICS,
    title: "about.offerings.items.analytics.title",
  },
  [ABOUT_OFFERINGS.BOOKING]: {
    description: "about.offerings.items.booking.description",
    icon: ABOUT_ICON_TYPE.BOOKING,
    title: "about.offerings.items.booking.title",
  },
  [ABOUT_OFFERINGS.COLLABORATION]: {
    description: "about.offerings.items.collaboration.description",
    icon: ABOUT_ICON_TYPE.COLLABORATION,
    title: "about.offerings.items.collaboration.title",
  },
  [ABOUT_OFFERINGS.REMINDERS]: {
    description: "about.offerings.items.reminders.description",
    icon: ABOUT_ICON_TYPE.REMINDERS,
    title: "about.offerings.items.reminders.title",
  },
} as const;

const STAT_KEYS = {
  [ABOUT_STATS.BOOKINGS]: {
    label: "about.stats.bookings.label",
    value: "about.stats.bookings.value",
  },
  [ABOUT_STATS.BUSINESSES]: {
    label: "about.stats.businesses.label",
    value: "about.stats.businesses.value",
  },
  [ABOUT_STATS.SUPPORT]: {
    label: "about.stats.support.label",
    value: "about.stats.support.value",
  },
  [ABOUT_STATS.UPTIME]: {
    label: "about.stats.uptime.label",
    value: "about.stats.uptime.value",
  },
} as const;

/**
 * ViewModel hook para la pagina Sobre Nosotros (US-16 / KAN-16).
 * Encapsula la localizacion y estructura de datos de trayectoria, soluciones y metricas.
 */
export const useAboutViewModel = (): UseAboutViewModelReturn => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  const milestones: AboutMilestoneItem[] = useMemo(
    () => [
      {
        description: t(MILESTONE_KEYS[ABOUT_MILESTONES.M1].description),
        id: ABOUT_MILESTONES.M1,
        title: t(MILESTONE_KEYS[ABOUT_MILESTONES.M1].title),
        year: t(MILESTONE_KEYS[ABOUT_MILESTONES.M1].year),
      },
      {
        description: t(MILESTONE_KEYS[ABOUT_MILESTONES.M2].description),
        id: ABOUT_MILESTONES.M2,
        title: t(MILESTONE_KEYS[ABOUT_MILESTONES.M2].title),
        year: t(MILESTONE_KEYS[ABOUT_MILESTONES.M2].year),
      },
      {
        description: t(MILESTONE_KEYS[ABOUT_MILESTONES.M3].description),
        id: ABOUT_MILESTONES.M3,
        title: t(MILESTONE_KEYS[ABOUT_MILESTONES.M3].title),
        year: t(MILESTONE_KEYS[ABOUT_MILESTONES.M3].year),
      },
    ],
    [t],
  );

  const offerings: AboutOfferingItem[] = useMemo(
    () => [
      {
        description: t(OFFERING_KEYS[ABOUT_OFFERINGS.BOOKING].description),
        icon: OFFERING_KEYS[ABOUT_OFFERINGS.BOOKING].icon,
        id: ABOUT_OFFERINGS.BOOKING,
        title: t(OFFERING_KEYS[ABOUT_OFFERINGS.BOOKING].title),
      },
      {
        description: t(OFFERING_KEYS[ABOUT_OFFERINGS.REMINDERS].description),
        icon: OFFERING_KEYS[ABOUT_OFFERINGS.REMINDERS].icon,
        id: ABOUT_OFFERINGS.REMINDERS,
        title: t(OFFERING_KEYS[ABOUT_OFFERINGS.REMINDERS].title),
      },
      {
        description: t(
          OFFERING_KEYS[ABOUT_OFFERINGS.COLLABORATION].description,
        ),
        icon: OFFERING_KEYS[ABOUT_OFFERINGS.COLLABORATION].icon,
        id: ABOUT_OFFERINGS.COLLABORATION,
        title: t(OFFERING_KEYS[ABOUT_OFFERINGS.COLLABORATION].title),
      },
      {
        description: t(OFFERING_KEYS[ABOUT_OFFERINGS.ANALYTICS].description),
        icon: OFFERING_KEYS[ABOUT_OFFERINGS.ANALYTICS].icon,
        id: ABOUT_OFFERINGS.ANALYTICS,
        title: t(OFFERING_KEYS[ABOUT_OFFERINGS.ANALYTICS].title),
      },
    ],
    [t],
  );

  const stats: AboutStatItem[] = useMemo(
    () => [
      {
        id: ABOUT_STATS.BOOKINGS,
        label: t(STAT_KEYS[ABOUT_STATS.BOOKINGS].label),
        value: t(STAT_KEYS[ABOUT_STATS.BOOKINGS].value),
      },
      {
        id: ABOUT_STATS.BUSINESSES,
        label: t(STAT_KEYS[ABOUT_STATS.BUSINESSES].label),
        value: t(STAT_KEYS[ABOUT_STATS.BUSINESSES].value),
      },
      {
        id: ABOUT_STATS.UPTIME,
        label: t(STAT_KEYS[ABOUT_STATS.UPTIME].label),
        value: t(STAT_KEYS[ABOUT_STATS.UPTIME].value),
      },
      {
        id: ABOUT_STATS.SUPPORT,
        label: t(STAT_KEYS[ABOUT_STATS.SUPPORT].label),
        value: t(STAT_KEYS[ABOUT_STATS.SUPPORT].value),
      },
    ],
    [t],
  );

  return {
    milestones,
    offerings,
    stats,
  };
};
