export interface DeleteServiceConfirmDialogProps {
  readonly isOpen: boolean;
  readonly isPending?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly serviceName: string;
}
