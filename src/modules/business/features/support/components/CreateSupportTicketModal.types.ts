import type { CreateSupportTicketFormValues } from "../models/support.model";

export interface CreateSupportTicketModalProps {
  readonly isOpen: boolean;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (values: CreateSupportTicketFormValues) => Promise<void>;
}
