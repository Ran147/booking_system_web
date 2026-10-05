import type { ServiceFormValues } from "./ServiceForm.schema";

export interface CreateServicePayload {
  readonly businessId: string;
  readonly formValues: ServiceFormValues;
}

export interface CreateServiceResponse {
  readonly serviceId: string;
}
