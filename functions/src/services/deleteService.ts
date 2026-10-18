import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  DELETE_SERVICE_ERROR,
  DELETE_SERVICE_ERROR_REASON,
} from "./constants/DeleteServiceError.constants.js";
import type {
  DeleteServicePayload,
  DeleteServiceResponse,
} from "./models/DeleteService.mutation.js";
import { deleteServicePayloadSchema } from "./models/DeleteService.schema.js";
import { assertSubscriberOf } from "../shared/assertSubscriberOf.js";
import { BOOKING_STATUS } from "../shared/constants/BookingStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { SERVICE_STATUS } from "../shared/constants/ServiceStatus.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";

export const deleteService = onCall<
  DeleteServicePayload,
  Promise<DeleteServiceResponse>
>(async (request) => {
  const { businessId, serviceId } = readPayload(
    deleteServicePayloadSchema,
    request.data,
    DELETE_SERVICE_ERROR.INVALID_PAYLOAD,
  );

  assertSubscriberOf(request.auth, businessId);

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const serviceReference = businessReference
    .collection(FIRESTORE_COLLECTION.SERVICES)
    .doc(serviceId);
  const activeBookingsQuery = businessReference
    .collection(FIRESTORE_COLLECTION.BOOKINGS)
    .where("serviceId", "==", serviceId)
    .where("status", "in", [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED])
    .limit(1);

  return firestore.runTransaction(async (transaction) => {
    const serviceSnapshot = await transaction.get(serviceReference);
    if (!serviceSnapshot.exists) {
      throw new HttpsError("not-found", DELETE_SERVICE_ERROR.NOT_FOUND);
    }

    const serviceData = serviceSnapshot.data();
    if (serviceData?.status !== SERVICE_STATUS.INACTIVE) {
      throw new HttpsError(
        "failed-precondition",
        DELETE_SERVICE_ERROR.MUST_BE_INACTIVE,
        { reason: DELETE_SERVICE_ERROR_REASON.MUST_BE_INACTIVE },
      );
    }

    const activeBookingsSnapshot = await transaction.get(activeBookingsQuery);
    if (!activeBookingsSnapshot.empty) {
      throw new HttpsError(
        "failed-precondition",
        DELETE_SERVICE_ERROR.HAS_ACTIVE_BOOKINGS,
        { reason: DELETE_SERVICE_ERROR_REASON.HAS_ACTIVE_BOOKINGS },
      );
    }

    transaction.delete(serviceReference);
    return { deletedServiceId: serviceId };
  });
});
