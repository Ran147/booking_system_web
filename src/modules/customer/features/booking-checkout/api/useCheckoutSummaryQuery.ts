import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";
import type { Nullable } from "@/types";
import { fetchCheckoutSummary } from "./fetchCheckoutSummary";
import type { CheckoutSummary } from "../models/bookingCheckout.model";

const CHECKOUT_KEY_SEGMENT = "checkout";

/** Fresh on every visit, so a changed price shows up (AC-KAN-148-08). */
export const useCheckoutSummaryQuery = (
  businessSlug: string,
  serviceId: string,
): UseQueryResult<Nullable<CheckoutSummary>> =>
  useQuery({
    queryFn: () => fetchCheckoutSummary(businessSlug, serviceId, new Date()),
    queryKey: [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessSlug,
      FIRESTORE_COLLECTION.SERVICES,
      serviceId,
      CHECKOUT_KEY_SEGMENT,
    ],
    staleTime: 0,
  });
