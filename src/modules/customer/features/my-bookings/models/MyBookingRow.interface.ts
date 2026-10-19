import type { BookingStatus } from "@/domain";

// A booking ready to render: dates and business already resolved (AS-1).
export interface MyBookingRow {
  businessName: string;
  dateTimeLabel: string;
  detailPath: string;
  id: string;
  serviceName: string;
  status: BookingStatus;
}
