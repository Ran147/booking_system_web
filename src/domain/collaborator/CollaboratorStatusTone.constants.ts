import { TONE, type Tone } from "@/constants";

import {
  COLLABORATOR_STATUS,
  type CollaboratorStatus,
} from "./CollaboratorStatus.constants";

export const COLLABORATOR_STATUS_TONE = Object.freeze({
  [COLLABORATOR_STATUS.ACTIVE]: TONE.SUCCESS,
  [COLLABORATOR_STATUS.INACTIVE]: TONE.NEUTRAL,
  [COLLABORATOR_STATUS.INVITED]: TONE.WARNING,
} as const satisfies Record<CollaboratorStatus, Tone>);
