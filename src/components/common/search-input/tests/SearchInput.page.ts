import { fireEvent, screen } from "@testing-library/react";
import { ARIA_ROLE } from "@/shared/constants";

export interface SearchInputPageObject {
  changeSearchTerm: (label: string, searchTerm: string) => void;
  getSearchBox: (label: string) => HTMLElement;
}

// Uses a synchronous change event so the tests can drive the debounce with
// fake timers.
export const createSearchInputPage = (): SearchInputPageObject => {
  const getSearchBox = (label: string): HTMLElement =>
    screen.getByRole(ARIA_ROLE.SEARCHBOX, { name: label });

  const changeSearchTerm = (label: string, searchTerm: string): void => {
    fireEvent.change(getSearchBox(label), { target: { value: searchTerm } });
  };

  return { changeSearchTerm, getSearchBox };
};
