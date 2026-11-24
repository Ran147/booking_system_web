import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { generatePath, useNavigate, useParams } from "react-router";
import { FIRESTORE_COLLECTION, ROUTE_PATH, STRING } from "@/constants";
import { mapFirebaseError } from "@/services/firebase";
import type { Nullable } from "@/types";
import { fetchBookableCatalog } from "../api/fetchBookableCatalog";
import type {
  ServiceSelectionMessageKey,
  ServiceSelectionViewModel,
} from "../models/serviceSelection.model";

const SERVICE_REQUIRED_KEY: ServiceSelectionMessageKey =
  "serviceSelection.errors.serviceRequired";

export const useServiceSelectionViewModel = (): ServiceSelectionViewModel => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { businessSlug = STRING.EMPTY } = useParams();
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    STRING.EMPTY,
  );
  const [validationKey, setValidationKey] =
    useState<Nullable<ServiceSelectionMessageKey>>(null);

  const catalogQuery = useQuery({
    queryFn: () => fetchBookableCatalog(businessSlug),
    queryKey: [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessSlug,
      FIRESTORE_COLLECTION.SERVICES,
    ],
  });
  const services = catalogQuery.data?.services ?? [];

  return {
    currency: catalogQuery.data?.currency ?? STRING.EMPTY,
    handleContinue: (): void => {
      // AC-KAN-135-04: without a service the step stays and says why.
      if (!selectedServiceId) {
        setValidationKey(SERVICE_REQUIRED_KEY);
        return;
      }
      void navigate(
        generatePath(
          `${ROUTE_PATH.CUSTOMER.ROOT}/${ROUTE_PATH.CUSTOMER.BOOK_SERVICE}`,
          { businessSlug, serviceId: selectedServiceId },
        ),
      );
    },
    handleRetry: (): void => {
      void catalogQuery.refetch();
    },
    handleSelectService: (serviceId: string): void => {
      setValidationKey(null);
      setSelectedServiceId(serviceId);
    },
    isEmpty: catalogQuery.isSuccess && services.length === 0,
    isLoading: catalogQuery.isPending,
    language: i18n.language,
    loadErrorKey: catalogQuery.isError
      ? mapFirebaseError(catalogQuery.error).messageKey
      : null,
    selectedServiceId,
    services,
    validationKey,
  };
};
