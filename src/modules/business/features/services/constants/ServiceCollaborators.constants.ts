export const COLLABORATOR_SELECTION_MODE = Object.freeze({
  AUTOMATIC: "automatic",
  CUSTOMER_CHOICE: "customer_choice",
});

export type CollaboratorSelectionMode =
  (typeof COLLABORATOR_SELECTION_MODE)[keyof typeof COLLABORATOR_SELECTION_MODE];
