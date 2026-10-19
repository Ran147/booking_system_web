// Mirror of COLLABORATOR_STATUS in src/domain/collaborator/CollaboratorStatus.constants.ts
// — keep in sync.
export const COLLABORATOR_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  INVITED: "invited",
} as const);

export type CollaboratorStatus =
  (typeof COLLABORATOR_STATUS)[keyof typeof COLLABORATOR_STATUS];
