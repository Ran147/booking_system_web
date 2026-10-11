export interface BookingRemindersViewModel {
  handleToggle: () => void;
  isEnabled: boolean;
  isLoading: boolean;
  isSaveError: boolean;
  isSaving: boolean;
}
