import { z } from "zod";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type {
  AvailabilityQueryParams,
  DayAvailability,
} from "../models/availability.model";

const isoInstantSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)));

// AC-KAN-141-03: an answer that breaks the contract is never shown as slots;
// parse throws and the screen shows the unknown error.
const dayAvailabilitySchema = z.object({
  date: z.string(),
  slots: z.array(
    z.object({ endsAt: isoInstantSchema, startsAt: isoInstantSchema }),
  ),
  timeZone: z.string().min(1),
});

export const fetchAvailability = async ({
  businessId,
  collaboratorId,
  date,
  serviceId,
}: AvailabilityQueryParams): Promise<DayAvailability> => {
  const answer = await callFunction<Record<string, unknown>, unknown>(
    FUNCTION_NAME.GET_AVAILABILITY,
    {
      businessId,
      date,
      serviceId,
      ...(collaboratorId ? { collaboratorId } : {}),
    },
  );
  return dayAvailabilitySchema.parse(answer);
};
