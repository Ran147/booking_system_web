import { addCalendarDays, readWeekday } from "./calendarDate";
import { AVAILABILITY } from "../constants/Availability.constants";
import type {
  BookingBusinessHours,
  WeekDay,
} from "../models/availability.model";

interface BuildWeekDaysInput {
  readonly businessHours: BookingBusinessHours;
  /** First day of the week shown, YYYY-MM-DD. */
  readonly firstDay: string;
  /** Today in the business time zone, YYYY-MM-DD. */
  readonly today: string;
}

/** Whether the business opens on that weekday (AC-KAN-143-03). */
export const isOpenDay = (
  businessHours: BookingBusinessHours,
  date: string,
): boolean => (businessHours[readWeekday(date)]?.length ?? 0) > 0;

/** The last day a booking can be made, YYYY-MM-DD (AS-1). */
export const readLastBookableDay = (today: string): string =>
  addCalendarDays(today, AVAILABILITY.BOOKING_WINDOW_DAYS);

/**
 * The seven days of the strip. A day is disabled before today
 * (AC-KAN-140-04), after the booking window (AC-KAN-140-05) or on a weekday
 * without business hours (AC-KAN-143-03).
 */
export const buildWeekDays = ({
  businessHours,
  firstDay,
  today,
}: BuildWeekDaysInput): WeekDay[] => {
  const lastBookableDay = readLastBookableDay(today);

  return Array.from({ length: AVAILABILITY.DAYS_PER_WEEK }, (_, offset) => {
    const date = addCalendarDays(firstDay, offset);
    return {
      date,
      isDisabled:
        date < today ||
        date > lastBookableDay ||
        !isOpenDay(businessHours, date),
      isToday: date === today,
    };
  });
};

/** The open days from today to the end of the window, in order (AS-2). */
export const listOpenDays = (
  businessHours: BookingBusinessHours,
  today: string,
): string[] =>
  Array.from({ length: AVAILABILITY.BOOKING_WINDOW_DAYS + 1 }, (_, offset) =>
    addCalendarDays(today, offset),
  ).filter((date) => isOpenDay(businessHours, date));
