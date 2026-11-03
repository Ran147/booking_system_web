import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, I18N_NAMESPACE } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { useCurrentBusiness, useSignOut } from "@/modules/auth";
import { DEFAULT_LANDING_FOOTER_CONFIG } from "@/modules/landing/layout/constants";
import { mapFirebaseError } from "@/services/firebase";
import type { Nullable } from "@/types";
import { formatDateTime } from "@/utils/format";
import { useBusinessGateQuery } from "../api";
import {
  BUSINESS_GATE_STATE,
  type BusinessGateState,
} from "../constants/BusinessGateState.constants";
import type {
  BusinessGate,
  BusinessStatusGateViewModel,
} from "../models/businessStatusGate.model";

// The last business read wins over a failed refetch: a tab that regains focus
// offline keeps showing what it had (AC-KAN-33-12 applies to the first read).
const resolveGateState = (
  business: Nullable<BusinessGate>,
  isError: boolean,
): BusinessGateState => {
  if (!business) {
    return isError ? BUSINESS_GATE_STATE.ERROR : BUSINESS_GATE_STATE.CHECKING;
  }
  if (business.status === BUSINESS_STATUS.PENDING) {
    return BUSINESS_GATE_STATE.PENDING;
  }
  if (business.status === BUSINESS_STATUS.REJECTED) {
    return BUSINESS_GATE_STATE.REJECTED;
  }
  return BUSINESS_GATE_STATE.PORTAL;
};

// The business time zone; the browser's when the business has none.
const readTimeZone = (business: BusinessGate): string =>
  business.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Decide si el dueño ve el portal o una pantalla de estado
 * (US-33: AC-KAN-33-09 … 12, AC-KAN-39-07).
 * @returns {BusinessStatusGateViewModel}
 */
export const useBusinessStatusGateViewModel =
  (): BusinessStatusGateViewModel => {
    const { i18n, t } = useTranslation(I18N_NAMESPACE.COMMON);
    const { businessId } = useCurrentBusiness();
    const signOut = useSignOut();
    const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

    const businessQuery = useBusinessGateQuery(businessId);
    const business = businessQuery.data ?? null;
    const gateState = resolveGateState(business, businessQuery.isError);
    const language = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;

    const handleSignOut = (): void => {
      setIsSigningOut(true);
      void signOut().finally(() => {
        setIsSigningOut(false);
      });
    };

    return {
      errorMessage:
        gateState === BUSINESS_GATE_STATE.ERROR
          ? t(mapFirebaseError(businessQuery.error).messageKey)
          : null,
      gateState,
      handleRetry: (): void => {
        void businessQuery.refetch();
      },
      handleSignOut,
      isSigningOut,
      pendingApproval:
        business && gateState === BUSINESS_GATE_STATE.PENDING
          ? {
              businessName: business.name,
              signedUpAtLabel: business.signedUpAt
                ? formatDateTime(
                    business.signedUpAt,
                    readTimeZone(business),
                    language,
                  )
                : null,
            }
          : null,
      rejection:
        business && gateState === BUSINESS_GATE_STATE.REJECTED
          ? {
              businessName: business.name,
              contactEmail: DEFAULT_LANDING_FOOTER_CONFIG.EMAIL,
              reason: business.rejectionReason,
            }
          : null,
    };
  };
