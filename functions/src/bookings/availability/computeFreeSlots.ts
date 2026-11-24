import {
  AVAILABILITY,
  WEEKDAY_NAME_BY_UTC_DAY,
} from "./constants/Availability.constants.js";
import type {
  AvailabilityBlock,
  AvailabilityResource,
  AvailabilitySlot,
  ComputeFreeSlotsInput,
} from "./models/Availability.model.js";
import { BOOKING_STATUS } from "../../shared/constants/BookingStatus.constants.js";
import { resolveZonedInstant } from "../../shared/zonedTime.js";

const DATE_PART_SEPARATOR = "-";
const TIME_PART_SEPARATOR = ":";
const OPEN_BOOKING_STATUSES: readonly string[] = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.PENDING,
];

interface TimePeriod {
  readonly endsAt: Date;
  readonly startsAt: Date;
}

const readMinutesOfDay = (timeText: string): number => {
  const [hour = 0, minute = 0] = timeText
    .split(TIME_PART_SEPARATOR)
    .map(Number);
  return hour * AVAILABILITY.MINUTES_PER_HOUR + minute;
};

const formatTimeText = (minutesOfDay: number): string => {
  const hour = Math.floor(minutesOfDay / AVAILABILITY.MINUTES_PER_HOUR);
  const minute = minutesOfDay % AVAILABILITY.MINUTES_PER_HOUR;
  return `${String(hour).padStart(AVAILABILITY.TIME_TEXT_DIGITS, "0")}:${String(minute).padStart(AVAILABILITY.TIME_TEXT_DIGITS, "0")}`;
};

const readWeekdayName = (dateText: string): string => {
  const [year = 0, month = 1, day = 1] = dateText
    .split(DATE_PART_SEPARATOR)
    .map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return WEEKDAY_NAME_BY_UTC_DAY[
    utcDay as keyof typeof WEEKDAY_NAME_BY_UTC_DAY
  ];
};

// Two periods overlap when each one starts before the other ends, so a
// booking that ends exactly when the next one starts does not overlap it.
const overlaps = (first: TimePeriod, second: TimePeriod): boolean =>
  first.startsAt.getTime() < second.endsAt.getTime() &&
  second.startsAt.getTime() < first.endsAt.getTime();

const isResourceFree = (
  candidate: TimePeriod,
  resource: AvailabilityResource,
  businessBlocks: readonly AvailabilityBlock[],
): boolean =>
  !resource.bookings.some(
    (booking) =>
      OPEN_BOOKING_STATUSES.includes(booking.status) &&
      overlaps(candidate, booking),
  ) &&
  ![...businessBlocks, ...resource.blocks].some((block) =>
    overlaps(candidate, block),
  );

// Candidate start instants of a day: every slot interval inside each opening
// range that still fits the service before that range closes (spec §3.3).
// A start time that does not exist because of a daylight-saving change is
// skipped; overlapping ranges never produce the same start twice.
const buildCandidateStarts = ({
  businessHours,
  date,
  durationMinutes,
  timeZone,
}: ComputeFreeSlotsInput): readonly Date[] => {
  const ranges = businessHours[readWeekdayName(date)] ?? [];
  const startByInstant = new Map<number, Date>();

  for (const range of ranges) {
    const closesAtMinutes = readMinutesOfDay(range.closesAt);
    for (
      let startMinutes = readMinutesOfDay(range.opensAt);
      startMinutes + durationMinutes <= closesAtMinutes;
      startMinutes += AVAILABILITY.SLOT_INTERVAL_MINUTES
    ) {
      const startsAt = resolveZonedInstant(
        date,
        formatTimeText(startMinutes),
        timeZone,
      );
      if (startsAt) {
        startByInstant.set(startsAt.getTime(), startsAt);
      }
    }
  }

  return [...startByInstant.values()];
};

/**
 * Free slots of one local day for a service. Pure: it reads nothing and
 * writes nothing, so the same function serves `getAvailability` and the
 * revalidation inside `createBooking` (spec KAN-139, section 3).
 *
 * A slot is returned when at least one resource is free for the whole
 * service duration. Slots are ordered by start instant.
 */
export const computeFreeSlots = (
  input: ComputeFreeSlotsInput,
): readonly AvailabilitySlot[] => {
  const { businessBlocks, durationMinutes, now, resources } = input;
  const durationMs = durationMinutes * AVAILABILITY.MS_PER_MINUTE;

  if (resources.length === 0) {
    return [];
  }

  return buildCandidateStarts(input)
    .filter((startsAt) => startsAt.getTime() >= now.getTime())
    .sort((first, second) => first.getTime() - second.getTime())
    .flatMap((startsAt) => {
      const candidate = {
        endsAt: new Date(startsAt.getTime() + durationMs),
        startsAt,
      };
      const freeResourceIds = resources
        .filter((resource) =>
          isResourceFree(candidate, resource, businessBlocks),
        )
        .map((resource) => resource.id);

      return freeResourceIds.length > 0
        ? [{ ...candidate, freeResourceIds }]
        : [];
    });
};
