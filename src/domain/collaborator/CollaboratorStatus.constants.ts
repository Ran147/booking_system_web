import type { TransitionMap } from "../stateMachine";

// invited: registered by the subscriber (KAN-78) and waiting for the
// collaborator to accept the email invitation (KAN-79). The collaborator's
// account gets access only while active. Deactivate (KAN-81) and reactivate
// (KAN-82) move between active and inactive.
export const COLLABORATOR_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  INVITED: "invited",
} as const;

export type CollaboratorStatus =
  (typeof COLLABORATOR_STATUS)[keyof typeof COLLABORATOR_STATUS];

export const COLLABORATOR_STATUS_TRANSITIONS: TransitionMap<CollaboratorStatus> =
  {
    [COLLABORATOR_STATUS.ACTIVE]: [COLLABORATOR_STATUS.INACTIVE],
    [COLLABORATOR_STATUS.INACTIVE]: [COLLABORATOR_STATUS.ACTIVE],
    [COLLABORATOR_STATUS.INVITED]: [COLLABORATOR_STATUS.ACTIVE],
  };
