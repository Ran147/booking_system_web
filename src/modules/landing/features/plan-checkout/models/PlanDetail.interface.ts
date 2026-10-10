import type { PlanDocument } from "./PlanDocument.schema";

/**
 * An active plan as the detail page reads it (KAN-21).
 */
export interface PlanDetail extends Omit<PlanDocument, "status"> {
  readonly id: string;
}
