import type { ServiceFormValues } from "./ServiceForm.schema";

export interface UpdateServicePayload {
  readonly businessId: string;
  readonly formValues: ServiceFormValues;
  readonly serviceId: string;
}

export interface UpdateServiceResponse {
  readonly serviceId: string;
}
