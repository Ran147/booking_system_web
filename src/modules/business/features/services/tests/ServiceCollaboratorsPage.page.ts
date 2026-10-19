import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Nullable } from "@/types";
import {
  COLLABORATOR_SELECTION_MODE,
  type CollaboratorSelectionMode,
} from "../constants/ServiceCollaborators.constants";

export interface ServiceCollaboratorsPageObject {
  readonly clickBack: () => Promise<void>;
  readonly clickSave: () => Promise<void>;
  readonly getCollaboratorCheckbox: (collaboratorId: string) => HTMLElement;
  readonly getCollaboratorWarningElement: (
    collaboratorId: string,
  ) => Nullable<HTMLElement>;
  readonly getModeButton: (mode: CollaboratorSelectionMode) => HTMLElement;
  readonly isNoCollaboratorNoticeVisible: () => boolean;
  readonly isReadOnlyNoticeVisible: () => boolean;
  readonly isSaveDisabled: () => boolean;
  readonly isSelectionModeVisible: () => boolean;
  readonly selectMode: (mode: CollaboratorSelectionMode) => Promise<void>;
  readonly toggleCollaborator: (collaboratorId: string) => Promise<void>;
}

export const createServiceCollaboratorsPageObject = (
  user = userEvent.setup(),
): ServiceCollaboratorsPageObject => {
  const toggleCollaborator = async (collaboratorId: string): Promise<void> => {
    const row = await screen.findByTestId(`collaborator-row-${collaboratorId}`);
    const checkbox = row.querySelector(
      'button[role="checkbox"]',
    ) as HTMLElement;
    await user.click(checkbox);
  };

  const selectMode = async (mode: CollaboratorSelectionMode): Promise<void> => {
    const testId =
      mode === COLLABORATOR_SELECTION_MODE.CUSTOMER_CHOICE
        ? "mode-customer-choice"
        : "mode-automatic";
    const modeButton = await screen.findByTestId(testId);
    await user.click(modeButton);
  };

  const clickSave = async (): Promise<void> => {
    const saveButton = screen.getByRole("button", {
      name: /save changes|guardar cambios/i,
    });
    await user.click(saveButton);
  };

  const clickBack = async (): Promise<void> => {
    const backButton = screen.getByRole("button", {
      name: /back|volver|atrás/i,
    });
    await user.click(backButton);
  };

  const getCollaboratorCheckbox = (collaboratorId: string): HTMLElement => {
    const row = screen.getByTestId(`collaborator-row-${collaboratorId}`);
    return row.querySelector('button[role="checkbox"]') as HTMLElement;
  };

  const getModeButton = (mode: CollaboratorSelectionMode): HTMLElement => {
    const testId =
      mode === COLLABORATOR_SELECTION_MODE.CUSTOMER_CHOICE
        ? "mode-customer-choice"
        : "mode-automatic";
    return screen.getByTestId(testId);
  };

  const isSelectionModeVisible = (): boolean => {
    const section = screen.queryByTestId("collaborator-selection-mode-section");
    return section !== null;
  };

  const isNoCollaboratorNoticeVisible = (): boolean => {
    const notice = screen.queryByTestId("no-collaborator-notice");
    return notice !== null;
  };

  const getCollaboratorWarningElement = (
    collaboratorId: string,
  ): Nullable<HTMLElement> => {
    return screen.queryByTestId(`warning-collaborator-${collaboratorId}`);
  };

  const isReadOnlyNoticeVisible = (): boolean => {
    const notice = screen.queryByTestId("readonly-notice");
    return notice !== null;
  };

  const isSaveDisabled = (): boolean => {
    const saveButton = screen.getByRole("button", {
      name: /save changes|guardar cambios|saving…|guardando…/i,
    });
    return (saveButton as HTMLButtonElement).disabled;
  };

  return {
    clickBack,
    clickSave,
    getCollaboratorCheckbox,
    getCollaboratorWarningElement,
    getModeButton,
    isNoCollaboratorNoticeVisible,
    isReadOnlyNoticeVisible,
    isSaveDisabled,
    isSelectionModeVisible,
    selectMode,
    toggleCollaborator,
  };
};
