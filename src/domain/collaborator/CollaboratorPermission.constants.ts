// What the subscriber can enable for a collaborator in the business portal
// (KAN-86). A closed list; the exact list is an assumption of the
// collaborators spec (AS-3). Without any permission a collaborator still sees
// their own bookings in the agenda. Subscription, business settings, business
// profile and collaborator management are never granted to a collaborator.
export const COLLABORATOR_PERMISSION = {
  MANAGE_BOOKINGS: "manage_bookings",
  MANAGE_CUSTOMERS: "manage_customers",
  MANAGE_SCHEDULE_BLOCKS: "manage_schedule_blocks",
  MANAGE_SERVICES: "manage_services",
  VIEW_REPORTS: "view_reports",
} as const;

export type CollaboratorPermission =
  (typeof COLLABORATOR_PERMISSION)[keyof typeof COLLABORATOR_PERMISSION];
