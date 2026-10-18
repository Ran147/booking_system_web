export interface DeleteServicePayload {
  readonly businessId: string;
  readonly serviceId: string;
}

export interface DeleteServiceResponse {
  readonly deletedServiceId: string;
}
